const assert = require('assert');
const withBuiltLibrary = require('../support/withBuiltLibrary');
var rangesOfComments;

withBuiltLibrary('utils/rangesOfComments', function(required) {
  rangesOfComments = required;
});

describe('rangesOfComments', function() {
  it('returns nothing when there are no comments', function() {
    assert.deepEqual(rangesOfComments('foo()'), []);
  });

  it('does not confuse string interpolation with comments', function() {
    assert.deepEqual(rangesOfComments('a\n  b: "#{c}"\n  d: e'), []);
  });

  it('correctly identifies escaped double quotes', function() {
    assert.deepEqual(rangesOfComments('a\n  b: "\\"#{c}"\n  d: e # E!'), [{ start: 23, end: 27, type: 'line' }]);
  });

  it('does not confuse single-quoted string contents with comments', function() {
    assert.deepEqual(rangesOfComments('a\n  b: \'#{c}\'\n  d: e'), []);
  });

  it('correctly identifies escaped single quotes', function() {
    assert.deepEqual(rangesOfComments('a\n  b: \'\\\'#{c}\'\n  d: e # E!'), [{ start: 23, end: 27, type: 'line' }]);
  });

  it('identifies block comments', function() {
    assert.deepEqual(rangesOfComments('###\n# a\n###'), [{ start: 0, end: 11, type: 'block' }]);
  });

  it('identifies indented block comments', function() {
    assert.deepEqual(rangesOfComments('a\n  ###\n  # b\n  ###\n  c: d'), [{ start: 4, end: 19, type: 'block' }]);
  });
});
