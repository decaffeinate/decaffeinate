import check from './support/check';

describe('semicolons', () => {
  it('are inserted after all the parentheses surrounding statements', () => {
    check(`
      ((->
        result)())
    `, `
      ((function() {
        return result;
      })());
    `);
  });
});
