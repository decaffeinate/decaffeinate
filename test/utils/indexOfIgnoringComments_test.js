import { strictEqual } from 'assert';
import indexOfIgnoringComments from '../../src/utils/indexOfIgnoringComments';

describe('indexOfIgnoringComments', function() {
  it('finds strings in source without comments as normal', () => {
    strictEqual(indexOfIgnoringComments('foo()', '()'), 'foo()'.indexOf('()'));
  });

  it('finds strings in source by ignoring comments', () => {
    strictEqual(indexOfIgnoringComments('a # b\nb', 'b'), 6);
  });

  it('returns -1 if no matching source can be found', () => {
    strictEqual(indexOfIgnoringComments('a # b\nc', 'b'), -1);
  });
});
