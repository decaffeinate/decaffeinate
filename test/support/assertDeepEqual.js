import { fail } from 'assert';

/**
 * Variant on assert.deepStrictEqual that does not do prototype checking so that
 * it can be used on values originating from different V8 contexts.
 */
export default function assertDeepEqual(actual, expected, message) {
  if (!isDeepEqual(actual, expected)) {
    fail(actual, expected, message, 'assertDeepEqual');
  }
}

function isDeepEqual(actual, expected) {
  if (actual === expected) {
    return true;
  }
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return false;
  }
  if (actual.constructor.name === 'Array' && expected.constructor.name === 'Array') {
    return actual.length === expected.length &&
      actual.every((val, i) => isDeepEqual(val, expected[i]));
  }
  if (actual.constructor.name === 'Object' && expected.constructor.name === 'Object') {
    return isDeepEqual(Object.keys(actual).sort(), Object.keys(expected).sort()) &&
      Object.keys(actual).every(key => isDeepEqual(actual[key], expected[key]));
  }
  return false;
}
