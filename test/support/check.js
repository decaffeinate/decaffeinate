import PatchError from '../../src/utils/PatchError.js';
import stripSharedIndent from '../../src/utils/stripSharedIndent.js';
import { convert } from '../../dist/decaffeinate.cjs.js';
import { strictEqual } from 'assert';

export default function check(source, expected) {
  try {
    let converted = convert(stripSharedIndent(source));
    strictEqual(converted.code, stripSharedIndent(expected));
  } catch (err) {
    if (PatchError.isA(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}
