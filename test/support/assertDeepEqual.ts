import { fail } from 'assert';

/**
 * Variant on assert.deepStrictEqual that does not do prototype checking so that
 * it can be used on values originating from different V8 contexts.
 */
// tslint:disable-next-line:no-any
export default function assertDeepEqual(actual: any, expected: any, message: string): void {
  if (!isDeepEqual(actual, expected)) {
    fail(actual, expected, message, 'assertDeepEqual');
  }
}

// tslint:disable-next-line:no-any
function isDeepEqual(actual: any, expected: any): boolean {
  if (actual === expected) {
    return true;
  }
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return false;
  }
  if (actual.constructor.name === 'Array' && expected.constructor.name === 'Array') {
    return actual.length === expected.length &&
      // tslint:disable-next-line:no-any
      actual.every((val: any, i: number) => isDeepEqual(val, expected[i]));
  }
  if (actual.constructor.name === 'Object' && expected.constructor.name === 'Object') {
    return isDeepEqual(Object.keys(actual).sort(), Object.keys(expected).sort()) &&
      Object.keys(actual).every(key => isDeepEqual(actual[key], expected[key]));
  }
  return false;
}
