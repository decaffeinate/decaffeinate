import { strictEqual } from 'assert';
import isSurroundedBy from '../../src/utils/isSurroundedBy';

describe('isSurroundedBy', function() {
  it('is false when the string does not start with the given grouping character', function() {
    strictEqual(isSurroundedBy('abc', '('), false);
  });

  it('is true when the string starts with the given grouping character and ends with its counterpart', function() {
    strictEqual(isSurroundedBy('(abc)', '('), true);
  });

  it('is false when the string starts and ends with the right characters but they do not match', function() {
    strictEqual(isSurroundedBy('(abc)(def)', '('), false);
  });
});
