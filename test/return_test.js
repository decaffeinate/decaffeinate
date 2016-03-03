import check from './support/check.js';

describe('return', () => {
  it('works with a return value', () =>
    check(`
      -> return 1
    `, `
      (function() { return 1; });
    `)
  );

  it('works without a return value', () =>
    check(`
      -> return
    `, `
      (function() { return; });
    `)
  );
});
