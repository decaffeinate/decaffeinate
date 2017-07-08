import { strictEqual } from 'assert';
import { convert } from '../../src/index';
import { Options } from '../../src/options';
import PatchError from '../../src/utils/PatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';

export type Extra = {
  options?: Options;
};

export default function check(
    source: string, expected: string, {options={}}: Extra = {}): void {
  if (source[0] === '\n') { source = stripSharedIndent(source); }
  if (expected[0] === '\n') { expected = stripSharedIndent(expected); }

  try {
    let converted = convert(source, {
      disableSuggestionComment: true,
      ...options,
    });
    strictEqual(converted.code, expected);
  } catch (err) {
    if (PatchError.detect(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}
