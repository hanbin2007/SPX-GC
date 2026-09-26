/** Runs async tasks one at a time, in call order. */
export function createLock() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const result = tail.catch(() => {}).then(task);
      tail = result;
      return result;
    }
  };
}
