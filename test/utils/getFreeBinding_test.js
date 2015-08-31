import getFreeBinding, { getFreeLoopBinding } from '../../src/utils/getFreeBinding';
import parse from '../../src/utils/parse';
import { strictEqual } from 'assert';

describe('getFreeBinding', () => {
  it('returns "ref" if nothing is defined', () => {
    let node = parse('');
    strictEqual(getFreeBinding(node.scope), 'ref');
  });

  it('adds a counter to the end of the binding if the binding is already taken', () => {
    let node = parse('ref = ref1 = 0');
    strictEqual(getFreeBinding(node.scope), 'ref2');
  });

  it('allows a base other than the default to be given', () => {
    let node = parse('error = null');
    strictEqual(getFreeBinding(node.scope, 'error'), 'error1');
  });
});

describe('getFreeLoopBinding', () => {
  it('returns "i" if that binding is not taken', () => {
    let node = parse('');
    strictEqual(getFreeLoopBinding(node.scope), 'i');
  });

  it('returns "j" if "i" is taken', () => {
    let node = parse('i = 0');
    strictEqual(getFreeLoopBinding(node.scope), 'j');
  });

  it('returns "k" if "i" and "j" are taken', () => {
    let node = parse('i = j = 0');
    strictEqual(getFreeLoopBinding(node.scope), 'k');
  });

  it('returns "i1" if "i", "j", and "k" are taken', () => {
    let node = parse('i = j = k = 0');
    strictEqual(getFreeLoopBinding(node.scope), 'i1');
  });
});
