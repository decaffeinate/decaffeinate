import { strict as assert } from 'assert';
import { convert } from '../../src/index';
import { DEFAULT_OPTIONS, Options } from '../../src/options';
import PatchError from '../../src/utils/PatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

export default function assertError(
  source: string,
  expectedErrorText: string,
  options: Options = DEFAULT_OPTIONS
): void {
  if (source[0] === '\n') {
    source = stripSharedIndent(source);
  }

  try {
    convert(source, options);
    assert.fail('Expected an error to be thrown');
  } catch (err: any) {
    if (PatchError.detect(err)) {
      const patchError = err as PatchError;
      if (patchError.message.includes(expectedErrorText)) {
        return;
      }

      assert.equal(patchError.message, expectedErrorText, `patch failed with code: ${patchError.source}`);
    }
    throw err;
  }
}
