import stripSharedIndent from '../../src/utils/stripSharedIndent.js';
import { convert } from '../../dist/decaffeinate.cjs.js';
import { strictEqual } from 'assert';

export default function check(source, expected) {
  let converted = convert(stripSharedIndent(source));
  strictEqual(converted.code, stripSharedIndent(expected));
}
