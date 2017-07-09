import { ok } from 'assert';
import { convert } from '../../src/index';
import { DEFAULT_OPTIONS, Options } from '../../src/options';
import PatchError from '../../src/utils/PatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

export default function assertError(
    source: string, expectedErrorText: string, options: Options=DEFAULT_OPTIONS): void {
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
