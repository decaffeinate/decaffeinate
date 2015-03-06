const assert = require('assert');
const withBuiltLibrary = require('../support/withBuiltLibrary');
var findCounterpartCharacter;

withBuiltLibrary('utils/findCounterpartCharacter', function(required) {
  findCounterpartCharacter = required;
});

describe('findCounterpartCharacter', function() {
  it('returns -1 when no counterpart can be found', function() {
    assert.strictEqual(findCounterpartCharacter('(', '(no ending paren here', 0), -1);
  });

  it('returns the index of the next counterpart when there are none in between', function() {
    assert.strictEqual(findCounterpartCharacter('(', '(abc)', 0), 4);
  });

  it('returns -1 when no counterpart can be found for the character at the given index', function() {
    assert.strictEqual(findCounterpartCharacter('(', '()(', 2), -1);
  });

  it('returns the index of the counterpart that balances out the character at the given index', function() {
    assert.strictEqual(findCounterpartCharacter('(', '((abc))', 0), 6);
  });
});
