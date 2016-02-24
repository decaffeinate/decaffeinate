import stripSharedIndent from '../../src/utils/stripSharedIndent.js';
import { convert } from '../../dist/decaffeinate.cjs.js';
import { strictEqual } from 'assert';

export default function check(source, expected) {
  strictEqual(convert(stripSharedIndent(source)), stripSharedIndent(expected));
}
