/* make all properties of T required */
export type AllRequired<T> = {
  [K in keyof T]-?: T[K];
};

export type Nilable<T> = T | null | undefined;

export type AllNilable<T> = {
  [K in keyof T]?: Nilable<T[K]>;
};
