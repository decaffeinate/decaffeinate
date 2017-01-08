import PatchError from '../../src/utils/PatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';
import { convert } from '../../src/index';
import { ok } from 'assert';

export default function assertError(source, expectedErrorText, options={}) {
  if (source[0] === '\n') { source = stripSharedIndent(source); }

  try {
    convert(source, options);
    ok(false, 'Expected an error to be thrown');
  } catch (err) {
    if (PatchError.detect(err) && err.message.includes(expectedErrorText)) {
      return;
    }
    throw err;
  }
}
