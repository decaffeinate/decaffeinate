import check from './support/check';

describe('debugger', () => {
  it('is passed through as-is', () => {
    check(
      `
      debugger
    `,
      `
      debugger;
    `,
    );
  });
});
