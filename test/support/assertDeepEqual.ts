import { fail } from 'assert';

/**
 * Variant on assert.deepStrictEqual that does not do prototype checking so that
 * it can be used on values originating from different V8 contexts.
 */
export default function assertDeepEqual(actual: unknown, expected: unknown, message: string): void {
  if (!isDeepEqual(actual, expected)) {
    fail(actual, expected, message, 'assertDeepEqual');
  }
}

function isDeepEqual(actual: unknown, expected: unknown): boolean {
  if (actual === expected) {
    return true;
  }
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return false;
  }
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return actual.length === expected.length && actual.every((val, i) => isDeepEqual(val, expected[i]));
  }
  if (typeof actual === 'object' && actual && typeof expected === 'object' && expected) {
    return (
      isDeepEqual(Object.keys(actual).sort(), Object.keys(expected).sort()) &&
      Object.keys(actual).every((key) =>
        isDeepEqual(actual[key as keyof typeof actual], expected[key as keyof typeof expected]),
      )
    );
  }
  return false;
}
