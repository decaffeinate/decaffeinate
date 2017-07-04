import PatchError from '../../src/utils/PatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';
import { convert } from '../../src/index';
import { deepEqual, strictEqual } from 'assert';

export default function check(source, expected, {options={}, expectedSuggestions}={}) {
  if (source[0] === '\n') { source = stripSharedIndent(source); }
  if (expected[0] === '\n') { expected = stripSharedIndent(expected); }

  try {
    let converted = convert(source, options);
    strictEqual(converted.code, expected);
    if (expectedSuggestions) {
      deepEqual(converted.suggestions, expectedSuggestions);
    }
  } catch (err) {
    if (PatchError.detect(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}
