import check from './support/check';

describe('`and` operator', () => {
  it('turns `and` into `&&`', () => {
    check(
      `
      a and b
    `,
      `
      a && b;
    `
    );
  });

  it('leaves `&&` alone', () => {
    check(
      `
      a && b
    `,
      `
      a && b;
    `
    );
  });

  it('works with equality-test operands', () => {
    check(
      `
      a is b and c is d
    `,
      `
      (a === b) && (c === d);
    `
    );
  });

  it('turns into `||` when used in an `unless`', () => {
    check(
      `
      unless a && b
        c()
    `,
      `
      if (!a || !b) {
        c();
      }
    `
    );
  });
});

describe('`or` operator', () => {
  it('turns `or` into `||`', () => {
    check(
      `
      a or b
    `,
      `
      a || b;
    `
    );
  });

  it('leaves `||` alone', () => {
    check(
      `
      a || b
    `,
      `
      a || b;
    `
    );
  });

  it('works with equality-test operands', () => {
    check(
      `
      a is b or c is d
    `,
      `
      (a === b) || (c === d);
    `
    );
  });

  it('turns into `&&` when used in an `unless`', () => {
    check(
      `
      unless a || b
        c()
    `,
      `
      if (!a && !b) {
        c();
      }
    `
    );
  });
});
