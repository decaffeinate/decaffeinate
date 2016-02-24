import check from './support/check.js';

describe('member access', () => {
  it('allows dot-on-the-next-line style member access', () => {
    check(`
      a
        .b
    `, `
      a
        .b;
    `);
  });

  it('allows dot-on-the-next-line style member access as a callee', () => {
    check(`
      a
        .b()
    `, `
      a
        .b();
    `);
  });

  it('allows dot-on-the-next-line style member access as a callee with arguments', () => {
    check(`
      a
        .b(1, 2)
    `, `
      a
        .b(1, 2);
    `);
  });

  it('allows chained dot-on-the-next-line style member access as a callee', () => {
    check(`
      a
        .b()
        .c()
    `, `
      a
        .b()
        .c();
    `);
  });

  it('allows assignment to member expressions of functions', () => {
    check(`
      a.b = ->
    `, `
      a.b = function() {};
    `);
  });
});
