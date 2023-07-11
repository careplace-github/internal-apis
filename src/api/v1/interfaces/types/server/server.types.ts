type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export { UnwrapPromise };
