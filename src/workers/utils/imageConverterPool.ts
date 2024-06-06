import type { ImgBitMap } from '@arkntools/unity-js';
import { transfer } from 'comlink';
import Emitter from 'eventemitter3';
import { uid } from 'uid';

interface Task {
  id: string;
  name: string;
  bitmap: ImgBitMap;
}

type ImageConverter = typeof import('../imageConverter');

interface Input {
  name: string;
  bitmap: ImgBitMap;
}

interface Output {
  name: string;
  data: ArrayBuffer;
}

interface WorkerUnitEvents {
  done: (id: string, output?: Output) => any;
}

class ImageConverterThread {
  private _worker!: InstanceType<typeof ComlinkWorker<ImageConverter>>;
  private isWorking = false;

  constructor(
    private readonly id: number,
    private readonly emitter: Emitter<WorkerUnitEvents>,
    private readonly taskList: Task[],
  ) {}

  private get worker() {
    if (this._worker) return this._worker;
    console.debug('[ImageConverterThread] create thread', this.id);
    const worker = new ComlinkWorker<ImageConverter>(new URL('../imageConverter.js', import.meta.url));
    this._worker = worker;
    return worker;
  }

  async run() {
    if (this.isWorking || !this.taskList.length) return;
    this.isWorking = true;
    while (true) {
      const task = this.taskList.pop();
      if (!task) break;
      try {
        const data = await this.worker.toPNG(transfer(task.bitmap, [task.bitmap.data]));
        this.emitter.emit('done', task.id, { name: task.name, data });
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
    this.pool = Array.from({ length: threadNum }).map(
      (_, i) => new ImageConverterThread(i, this.emitter, this.taskList),
    );
  }

  addTasks(inputs: Input[], callback: (output: Output) => any) {
    console.debug('[ImageConverterPool] start task, length', inputs.length);
    const ids = new Set<string>();
    const tasks: Task[] = inputs.map(input => {
      const id = uid();
      ids.add(id);
      return { id, ...input };
    });
    let resolvePromise: () => void;
    const promise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });
    const callbackPromises: any[] = [];
    const handler = async (id: string, output?: Output) => {
      if (!ids.has(id)) return;
      ids.delete(id);
      if (output) callbackPromises.push(callback(output));
      if (ids.size) return;
      this.emitter.off('done', handler);
      await Promise.allSettled(callbackPromises);
      resolvePromise();
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
