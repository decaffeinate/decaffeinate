import check from './support/check.js';

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
});
