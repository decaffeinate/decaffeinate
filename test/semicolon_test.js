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

  it('are inserted after the closing function braces for a function expression', () => {
    check(`
      a = ->
        b # c
      d
    `, `
      var a = function() {
        return b; // c
      };
      d;
    `);
  });
});
