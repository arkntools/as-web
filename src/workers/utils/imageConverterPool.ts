import '@ungap/with-resolvers';
import type { ImgBitMap } from '@arkntools/unity-js';
import { loopMap } from '@arkntools/unity-js/utils/loop';
import { transfer, wrap } from 'comlink';
import type { Remote } from 'comlink';
import Emitter from 'eventemitter3';
import { uid } from 'uid';
import ImageConverterWorker from '@/workers/imageConverter?worker';

interface Task {
  id: string;
  key: string;
  bitmap: ImgBitMap;
}

type ImageConverter = typeof import('@/workers/imageConverter');

interface Input {
  key: string;
  bitmap: ImgBitMap;
}

interface Output {
  key: string;
  data: Uint8Array<ArrayBuffer>;
}

interface WorkerUnitEvents {
  done: (id: string, output?: Output) => any;
}

class ImageConverterThread {
  private isWorking = false;
  #worker?: Remote<ImageConverter>;

  constructor(
    private readonly id: number,
    private readonly emitter: Emitter<WorkerUnitEvents>,
    private readonly taskList: Task[],
  ) {}

  private get worker() {
    if (this.#worker) return this.#worker;
    console.debug('[ImageConverterThread] create thread', this.id);
    const worker = wrap<ImageConverter>(new ImageConverterWorker());
    this.#worker = worker;
    return worker;
  }

  async run() {
    if (this.isWorking || !this.taskList.length) return;
    this.isWorking = true;
    while (true) {
      const task = this.taskList.pop();
      if (!task) break;
      console.debug(`[ImageConverterThread] thread ${this.id} start ${task.key}`);
      try {
        const data = await this.worker.toPNG(transfer(task.bitmap, [task.bitmap.data]));
        this.emitter.emit('done', task.id, { key: task.key, data });
      } catch (error) {
        console.error(error);
        this.emitter.emit('done', task.id);
      }
    }
    this.isWorking = false;
  }
}

export class ImageConverterPool {
  private readonly pool: ImageConverterThread[];
  private readonly emitter = new Emitter<WorkerUnitEvents>();
  private readonly taskList: Task[] = [];

  constructor() {
    const threadNum = Math.max(navigator.hardwareConcurrency - 1, 1);
    this.pool = loopMap(threadNum, i => new ImageConverterThread(i, this.emitter, this.taskList));
  }

  addTask(bitmap: ImgBitMap): Promise<Uint8Array<ArrayBuffer>> {
    const id = uid();
    const tasks: Task[] = [{ id, key: '', bitmap }];
    const { resolve, reject, promise } = Promise.withResolvers<Uint8Array<ArrayBuffer>>();
    const handler = async (targetId: string, output?: Output) => {
      if (targetId !== id) return;
      this.emitter.off('done', handler);
      if (output) resolve(output.data);
      else reject(new Error('[ImageConverterPool] task failed'));
    };
    this.emitter.on('done', handler);
    this.start(tasks);
    return promise;
  }

  addTasks(inputs: Input[], callback: (output: Output) => any) {
    console.debug('[ImageConverterPool] start task, length', inputs.length);
    const ids = new Set<string>();
    const tasks: Task[] = inputs.map(input => {
      const id = uid();
      ids.add(id);
      return { id, ...input };
    });
    const { resolve, promise } = Promise.withResolvers<void>();
    const callbackPromises: any[] = [];
    const handler = async (id: string, output?: Output) => {
      if (!ids.has(id)) return;
      ids.delete(id);
      if (output) callbackPromises.push(callback(output));
      if (ids.size) return;
      this.emitter.off('done', handler);
      await Promise.allSettled(callbackPromises);
      resolve();
    };
    this.emitter.on('done', handler);
    this.start(tasks);
    return promise;
  }

  private start(tasks: Task[]) {
    this.taskList.push(...tasks.reverse());
    this.pool.forEach(thread => {
      thread.run();
    });
  }
}

export const imageConverterPool = new ImageConverterPool();
