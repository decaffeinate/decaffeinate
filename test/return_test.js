import check from './support/check';

describe('return', () => {
  it('works with a return value', () =>
    check(`
      -> a; return 1
    `, `
      (function() { a; return 1; });
    `)
  );

  it('works without a return value', () =>
    check(`
      ->
        return if a
    `, `
      (function() {
        if (a) { return; }
      });
    `)
  );

  it('forces the return value to be an expression', () =>
    check(`
      -> return if true then null
    `, `
      () => true ? null : undefined;
    `)
  );

  it('preserves comments when removing trailing empty returns', () =>
    check(`
      ->
        a  # b
        return
    `, `
      (function() {
        a;  // b
      });
    `)
  );

  it('correctly removes trailing empty returns on the same line as another statement', () =>
    check(`
      -> a; return
    `, `
      (function() { a; });
    `)
  );

  it('correctly removes trailing empty returns as the only function statement', () =>
    check(`
      -> return
    `, `
      (function() {  });
    `)
  );
});
