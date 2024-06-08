export const hasMenuOpenKey = Symbol() as InjectionKey<() => boolean>;

export const closeMenuExceptKey = Symbol() as InjectionKey<(index: number) => void>;
