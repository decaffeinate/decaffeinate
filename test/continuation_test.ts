import check from './support/check';

describe('continuation', () => {
  it('is removed when continuing a binary operator', () => {
    check(
      `
      a \\
        + 1
    `,
      `
      a 
        + 1;
    `,
    );
  });

  it('is removed when continuing a function call', () => {
    check(
      `
      a \\
        b
    `,
      `
      a( 
        b);
    `,
    );
  });
});
