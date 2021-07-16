import check from './support/check';

function checkNullishCoalescing(source: string, expected: string): void {
  check(source, expected, { options: { nullishCoalescing: true } });
}

describe('with nullish coalescing enabled', () => {
  it('translates binary existence to nullish coalescing', () => {
    checkNullishCoalescing(
      `
      a = 1
      b = a ? 2
    `,
      `
      const a = 1;
      const b = a ?? 2;
    `
    );
  });

  it('falls back to a check if the LHS may be undeclared', () => {
    checkNullishCoalescing(
      `
      b = a ? 2
    `,
      `
      const b = typeof a !== 'undefined' && a !== null ? a : 2;
    `
    );
  })
});
