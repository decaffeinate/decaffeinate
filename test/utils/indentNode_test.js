import MagicString from 'magic-string';
import indentNode from '../../src/utils/indentNode';
import parse from '../../src/utils/parse';
import { strictEqual as eq } from 'assert';

describe('indentNode', () => {
  it('handles empty lines', () => {
    const source = 'a\n  b: c\n\n  d: e';
    const patcher = new MagicString(source);
    const node = parse(source).body.statements[0];
    indentNode(node, patcher);
    eq(patcher.toString(), '  a\n    b: c\n\n    d: e');
  });
});
