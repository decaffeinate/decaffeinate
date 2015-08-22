import check from './support/check';

describe('string interpolation', () => {
  it('ensures backticks are escaped', () => {
    check('"`#{name}` is required"', '`\\`${name}\\` is required`;');
  });
});
