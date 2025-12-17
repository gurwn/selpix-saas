export function assert(condition: boolean, arg?: string): asserts condition;
export function assert(condition: boolean, arg?: Error): asserts condition;
export function assert(
  condition: boolean,
  arg?: string | Error
): asserts condition {
  if (!condition) {
    throw arg instanceof Error ? arg : new Error(arg);
  }
}
