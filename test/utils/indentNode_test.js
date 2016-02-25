import MagicString from 'magic-string';
import indentNode from '../../src/utils/indentNode.js';
import parse from '../../src/utils/parse.js';
import { strictEqual as eq } from 'assert';

describe('indentNode', () => {
  it('handles empty lines', () => {
    let source = 'a\n  b: c\n\n  d: e';
    let patcher = new MagicString(source);
    let node = parse(source).body.statements[0];
    indentNode(node, patcher);
    eq(patcher.toString(), '  a\n    b: c\n\n    d: e');
  });
});
