import { strictEqual } from 'assert';
import lastIndexOfIgnoringComments from '../../src/utils/lastIndexOfIgnoringComments';

describe('lastIndexOfIgnoringComments', function() {
  it('finds the last instance of a string as normal when there are no comments', function() {
    strictEqual(lastIndexOfIgnoringComments('a()\na', 'a'), 4);
  });

  it('finds the last instance of a string not inside comments', function() {
    strictEqual(lastIndexOfIgnoringComments('a() # a', 'a'), 0);
  });

  it('finds the last instance before a particular index', function() {
    strictEqual(lastIndexOfIgnoringComments('a() # a\na', 'a', 6), 0);
    strictEqual(lastIndexOfIgnoringComments('a++', '+', 1), 1);
  });
});
