const assert = require('assert');
const withBuiltLibrary = require('../support/withBuiltLibrary');
var isSurroundedBy;

withBuiltLibrary('utils/isSurroundedBy', function(required) {
  isSurroundedBy = required;
});

describe('isSurroundedBy', function() {
  it('is false when the string does not start with the given grouping character', function() {
    assert.strictEqual(isSurroundedBy('abc', '('), false);
  });

  it('is true when the string starts with the given grouping character and ends with its counterpart', function() {
    assert.strictEqual(isSurroundedBy('(abc)', '('), true);
  });

  it('is false when the string starts and ends with the right characters but they do not match', function() {
    assert.strictEqual(isSurroundedBy('(abc)(def)', '('), false);
  });
});
