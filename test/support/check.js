import PatchError from '../../src/utils/PatchError';
import stripSharedIndent from '../../src/utils/stripSharedIndent';
import { convert } from '../../src/index';
import { strictEqual } from 'assert';

export default function check(source, expected, {options={}}={}) {
  if (source[0] === '\n') { source = stripSharedIndent(source); }
  if (expected[0] === '\n') { expected = stripSharedIndent(expected); }

  try {
    let converted = convert(source, Object.assign({
      preferConst: true,
      keepCommonJS: true,
      enableBabelConstructorWorkaround: true,
      disableSuggestions: true,
    }, options));
    strictEqual(converted.code, expected);
  } catch (err) {
    if (PatchError.detect(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}
