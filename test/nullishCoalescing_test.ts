import baseCheck from './support/check';

function check(source: string, expected: string): void {
  baseCheck(source, expected, { options: { nullishCoalescing: true } });
}

describe('binary existence with nullish coalescing enabled', () => {
  describe('as a statement', () => {
    it('handles a global as the LHS', () => {
      check(
        `
        a ? b
      `,
        `
        if (typeof a === 'undefined' || a === null) { b; }
      `,
      );
    });

    it('handles a safe-to-repeat member expression as the LHS', () => {
      check(
        `
        a.b ? a
      `,
        `
        if (a.b == null) { a; }
      `,
      );
    });

    it('handlesa `this` accesses as the LHS', () => {
      check(
        `
        @a ? @b
      `,
        `
        if (this.a == null) { this.b; }
      `,
      );
    });

    it('handles a `this` access on the RHS', () => {
      check(
        `
        a ? @b
      `,
        `
        if (typeof a === 'undefined' || a === null) { this.b; }
      `,
      );
    });

    it('handles an unsafe-to-repeat member expression as the LHS', () => {
      check(
        `
      a() ? b
    `,
        `
      if (a() == null) { b; }
    `,
      );
    });

    it('handles multiline operator with escaped newline', () => {
      check(
        `
      a ? \\
        b
    `,
        `
      if (typeof a === 'undefined' || a === null) { b; }
    `,
      );
    });
  });

  describe('as an expression', () => {
    it('translates to nullish coalescing', () => {
      check(
        `
        a = 1
        b = a ? 2
      `,
        `
        const a = 1;
        const b = a ?? 2;
      `,
      );
    });

    it('falls back to a check if the LHS may be undeclared', () => {
      check(
        `
        b = a ? 2
      `,
        `
        const b = typeof a !== 'undefined' && a !== null ? a : 2;
      `,
      );
    });

    it('handles a global as the LHS', () => {
      check(
        `
      x = (a ? b)
    `,
        `
      const x = (typeof a !== 'undefined' && a !== null ? a : b);
    `,
      );
    });

    it('handles a local as the LHS', () => {
      check(
        `
        a = 1
        x = (a ? b)
      `,
        `
        const a = 1;
        const x = (a ?? b);
      `,
      );
    });

    it('handles a safe-to-repeat member expression as the LHS', () => {
      check(
        `
        x = (a.b ? a)
      `,
        `
        const x = (a.b ?? a);
      `,
      );
    });

    it('handles a this-access as the LHS', () => {
      check(
        `
        x = (@a.b ? c)
      `,
        `
        const x = (this.a.b ?? c);
      `,
      );
    });

    it('handles an unsafe-to-repeat member expression as the LHS', () => {
      check(
        `
        x = (a() ? b)
      `,
        `
        const x = (a() ?? b);
      `,
      );
    });

    it('works when used as a negated condition', () => {
      check(
        `
        unless 1 ? 2 then 3
        `,
        `
        if (!(1 ?? 2)) { 3; }
        `,
      );
    });

    it('works when combined with plus', () => {
      check(
        `
        y = 1
        x = 1 + (y ? 0)
      `,
        `
        const y = 1;
        const x = 1 + (y ?? 0);
      `,
      );
    });
  });
});
