export type RunStep = <T>(name: string, fn: () => Promise<T>) => Promise<T>;

export const inlineRunStep: RunStep = (_name, fn) => fn();
