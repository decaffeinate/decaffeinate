import check from './support/check';

describe('remainder', () => {
  it('is passed through as-is', () => {
    check('a % b', 'a % b;');
  });

  it('processes the left-hand expression', () => {
    check(
      `
      (a 0) % b
    `,
      `
      (a(0)) % b;
    `
    );
  });

  it('processes its right-hand expression', () => {
    check(
      `
      a % (b 0)
    `,
      `
      a % (b(0));
    `
    );
  });
});
