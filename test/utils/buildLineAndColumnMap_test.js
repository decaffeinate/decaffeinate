const assert = require('assert');
const withBuiltLibrary = require('../support/withBuiltLibrary');
var buildLineAndColumnMap;

withBuiltLibrary('utils/buildLineAndColumnMap', function(required) {
  buildLineAndColumnMap = required;
});

describe('buildLineAndColumnMap', function() {
  context('with a single-line string', function() {
    it('maps line 0 column N to offset N', function() {
      const map = buildLineAndColumnMap('hey');
      assert.strictEqual(map.getOffset(0, 0), 0);
      assert.strictEqual(map.getOffset(0, 1), 1);
      assert.strictEqual(map.getOffset(0, 2), 2);
      assert.strictEqual(map.getOffset(0, 3), 3);
    });

    it('maps lines > 0 to null', function() {
      const map = buildLineAndColumnMap('hey');
      assert.strictEqual(map.getOffset(1, 0), null);
    });

    it('maps columns < the length to null', function() {
      const map = buildLineAndColumnMap('hey');
      assert.strictEqual(map.getOffset(0, 4), null);
    });

    it('maps offset N to line 0 column N', function() {
      const map = buildLineAndColumnMap('hey');
      assert.deepEqual(map.getLocation(0), [0, 0]);
      assert.deepEqual(map.getLocation(1), [0, 1]);
      assert.deepEqual(map.getLocation(2), [0, 2]);
      assert.deepEqual(map.getLocation(3), [0, 3]);
    });
  });

  context('with a multi-line string', function() {
    it('maps line N column M to length of lines < N plus M', function() {
      const map = buildLineAndColumnMap('hey\nthere');
      assert.strictEqual(map.getOffset(0, 1), 1);
      assert.strictEqual(map.getOffset(1, 1), 5);
    });

    it('maps offset N to the appropriate line/column pair', function() {
      const map = buildLineAndColumnMap('hey\nthere');
      assert.deepEqual(map.getLocation(0), [0, 0]);
      assert.deepEqual(map.getLocation(4), [1, 0]);
    });
  });
});
