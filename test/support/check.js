import stripSharedIndent from '../../src/utils/stripSharedIndent';
import { convert } from '../../src/index';
import { strictEqual } from 'assert';

export default function check(source, expected) {
  strictEqual(convert(stripSharedIndent(source)), stripSharedIndent(expected));
}
