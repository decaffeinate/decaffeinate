import { strictEqual } from 'assert';
import isSurroundedBy from '../../src/utils/isSurroundedBy';
import parse from '../../src/utils/parse';

describe('isSurroundedBy', function() {
  it('is false when the string does not start with the given grouping character', () => {
    const source = 'abc';
    const node = parse(source).body.statements[0];
    strictEqual(isSurroundedBy(node, '(', source), false);
  });

  it('is true when the string starts with the given grouping character and ends with its counterpart', () => {
    const source = '(abc)';
    const node = parse(source).body.statements[0];
    strictEqual(isSurroundedBy(node, '(', source), true);
  });

  it('is false when the string starts and ends with the right characters but they do not match', () => {
    const source = '(abc)(def)';
    const node = parse(source).body.statements[0];
    strictEqual(isSurroundedBy(node, '(', source), false);
  });
});
