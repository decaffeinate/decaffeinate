import { deepEqual, strictEqual } from 'assert';
import buildLineAndColumnMap from '../../src/utils/buildLineAndColumnMap';

describe('buildLineAndColumnMap', function() {
  context('with a single-line string', function() {
    it('maps line 0 column N to offset N', () => {
      const map = buildLineAndColumnMap('hey');
      strictEqual(map.getOffset(0, 0), 0);
      strictEqual(map.getOffset(0, 1), 1);
      strictEqual(map.getOffset(0, 2), 2);
      strictEqual(map.getOffset(0, 3), 3);
    });

    it('maps lines > 0 to null', () => {
      const map = buildLineAndColumnMap('hey');
      strictEqual(map.getOffset(1, 0), null);
    });

    it('maps columns < the length to null', () => {
      const map = buildLineAndColumnMap('hey');
      strictEqual(map.getOffset(0, 4), null);
    });

    it('maps offset N to line 0 column N', () => {
      const map = buildLineAndColumnMap('hey');
      deepEqual(map.getLocation(0), [0, 0]);
      deepEqual(map.getLocation(1), [0, 1]);
      deepEqual(map.getLocation(2), [0, 2]);
      deepEqual(map.getLocation(3), [0, 3]);
    });
  });

  context('with a multi-line string', function() {
    it('maps line N column M to length of lines < N plus M', () => {
      const map = buildLineAndColumnMap('hey\nthere');
      strictEqual(map.getOffset(0, 1), 1);
      strictEqual(map.getOffset(1, 1), 5);
    });

    it('maps offset N to the appropriate line/column pair', () => {
      const map = buildLineAndColumnMap('hey\nthere');
      deepEqual(map.getLocation(0), [0, 0]);
      deepEqual(map.getLocation(4), [1, 0]);
    });

    it('maps offsets outside the bounds of the string to null', () => {
      const map = buildLineAndColumnMap('');
      strictEqual(map.getLocation(1), null);
      strictEqual(map.getLocation(-1), null);
    });
  });
});
