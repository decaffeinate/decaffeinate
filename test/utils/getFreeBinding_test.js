import getFreeBinding from '../../src/utils/getFreeBinding';
import parse from '../../src/utils/parse';
import { strictEqual } from 'assert';

describe('getFreeBinding', function() {
  it('returns "ref" if nothing is defined', function() {
    let node = parse('');
    strictEqual(getFreeBinding(node.scope), 'ref');
  });

  it('adds a counter to the end of the binding if the binding is already taken', function() {
    let node = parse('ref = ref1 = 0');
    strictEqual(getFreeBinding(node.scope), 'ref2');
  });

  it('allows a base other than the default to be given', function() {
    let node = parse('error = null');
    strictEqual(getFreeBinding(node.scope, 'error'), 'error1');
  });
});
