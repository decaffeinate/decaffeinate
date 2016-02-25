import { strictEqual } from 'assert';
import isSurroundedBy from '../../src/utils/isSurroundedBy.js';
import parse from '../../src/utils/parse.js';

describe('isSurroundedBy', function() {
  it('is false when the string does not start with the given grouping character', () => {
    let source = 'abc';
    let node = parse(source).body.statements[0];
    strictEqual(isSurroundedBy(node, '(', source), false);
  });

  it('is true when the string starts with the given grouping character and ends with its counterpart', () => {
    let source = '(abc)';
    let node = parse(source).body.statements[0];
    strictEqual(isSurroundedBy(node, '(', source), true);
  });

  it('is false when the string starts and ends with the right characters but they do not match', () => {
    let source = '(abc)(def)';
    let node = parse(source).body.statements[0];
    strictEqual(isSurroundedBy(node, '(', source), false);
  });
});
