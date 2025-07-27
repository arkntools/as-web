import '@ungap/with-resolvers';
import { loopMap } from '@arkntools/unity-js/utils/loop';

export class PromisePool<T> {
  private readonly threads: Promise<void>[];
  private readonly taskQueue: T[] = [];
  private waitingResolvers: Array<() => void> = [];
  private isEnd = false;

  constructor(
    concurrency: number,
    private readonly handler: (task: T, threadIndex: number) => Promise<void>,
    private readonly errHandler?: (err: unknown, task: T, threadIndex: number) => void,
  ) {
    this.threads = loopMap(concurrency, this.createThread);
  }

  addTasks(tasks: T[]) {
    if (!tasks.length) return;
    this.taskQueue.push(...tasks);
    this.activateThreads();
  }

  end() {
    this.isEnd = true;
    this.activateThreads();
    return Promise.all(this.threads);
  }

  private activateThreads() {
    const resolvers = this.waitingResolvers;
    this.waitingResolvers = [];
    resolvers.forEach(resolve => resolve());
  }

  private createThread = async (index: number) => {
    while (true) {
      const task = this.taskQueue.shift();
      if (!task) {
        if (this.isEnd) break;
        await this.waitTask();
        continue;
      }
      try {
        await this.handler(task, index);
      } catch (err) {
        this.errHandler?.(err, task, index);
      }
    }
  };

  private async waitTask() {
    const { resolve, promise } = Promise.withResolvers<void>();
    this.waitingResolvers.push(resolve);
    await promise;
  }
}
