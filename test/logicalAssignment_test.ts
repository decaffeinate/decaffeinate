import baseCheck from './support/check';

function check(source: string, expected: string): void {
  baseCheck(source, expected, { options: { logicalAssignment: true } });
}

describe('with logical assignment enabled', () => {
  it('passes through logical AND assignment', () => {
    check(`a &&= 1`, `a &&= 1;`);
  });

  it('patches both sides of logical AND assignment', () => {
    check(`a[f x] &&= -> y`, `a[f(x)] &&= () => y;`);
  });

  it('passes through logical OR', () => {
    check(`a ||= 1`, `a ||= 1;`);
  });

  it('translates existence to nullish coalescing', () => {
    check(`a ?= 1`, `a ??= 1;`);
  });

  it('patches both sides of nullish coalescing assignment', () => {
    check(`a[f x] ?= -> y`, `a[f(x)] ??= () => y;`);
  });

  it('handles an implicit object literal on the RHS', () => {
    check(
      `
      a[b] ?=
        k1: v1
        k2: v2
    `,
      `
      a[b] ??= {
        k1: v1,
        k2: v2
      };
    `,
    );
  });
});
