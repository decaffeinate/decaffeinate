import findCounterpartCharacter from '../../src/utils/findCounterpartCharacter';
import { strictEqual } from 'assert';

describe('findCounterpartCharacter', function() {
  it('returns -1 when no counterpart can be found', () => {
    strictEqual(findCounterpartCharacter('(', '(no ending paren here', 0), -1);
  });

  it('returns the index of the next counterpart when there are none in between', () => {
    strictEqual(findCounterpartCharacter('(', '(abc)', 0), 4);
  });

  it('returns -1 when no counterpart can be found for the character at the given index', () => {
    strictEqual(findCounterpartCharacter('(', '()(', 2), -1);
  });

  it('returns the index of the counterpart that balances out the character at the given index', () => {
    strictEqual(findCounterpartCharacter('(', '((abc))', 0), 6);
  });
});
