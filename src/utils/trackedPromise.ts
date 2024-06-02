export type TrackedPromise<T> = Promise<T> & {
  isPending: () => boolean;
  isRejected: () => boolean;
  isFulfilled: () => boolean;
};

export const toTrackedPromise = <T>(promise: Promise<T>): TrackedPromise<T> => {
  let isPending = true;
  let isRejected = false;
  let isFulfilled = false;

  const trackedPromise = promise
    .then(value => {
      isFulfilled = true;
      isPending = false;
      return value;
    })
    .catch(error => {
      isRejected = true;
      isPending = false;
      throw error;
    }) as TrackedPromise<T>;

  trackedPromise.isFulfilled = () => isFulfilled;
  trackedPromise.isPending = () => isPending;
  trackedPromise.isRejected = () => isRejected;

  return trackedPromise;
};
