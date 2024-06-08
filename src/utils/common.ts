export const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

export const hasSelection = () => {
  const s = window.getSelection();
  return Boolean(s && s.rangeCount > 0 && !s.isCollapsed);
};

export const omit = <T extends Record<string, any>, U extends keyof T>(obj: T, keys: U | U[]): Omit<T, U> => {
  const newObj = { ...obj };
  if (Array.isArray(keys)) {
    keys.forEach(key => {
      delete newObj[key];
    });
  } else {
    delete newObj[keys];
  }
  return newObj as any;
};

export const pick = <T extends Record<string, any>, U extends keyof T>(obj: T, keys: U | U[]): Pick<T, U> => {
  const keySet = new Set(Array.isArray(keys) ? keys : [keys]);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => keySet.has(k as U))) as any;
};

export const mapValues = <T extends Record<string, any>>(
  obj: T,
  callbackfn: <U extends Extract<keyof T, string>>(value: T[U], key: U) => T[keyof T],
): T => Object.fromEntries(Object.entries(obj).map(([k, v]) => callbackfn(v, k as any))) as any;
