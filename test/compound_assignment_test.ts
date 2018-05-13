import check from './support/check';

describe('compound assignment', () => {
  it('passes through addition', () => {
    check(`a += 1`, `a += 1;`);
  });

  it('passes through subtraction', () => {
    check(`a -= 1`, `a -= 1;`);
  });

  it('passes through multiplication', () => {
    check(`a *= 1`, `a *= 1;`);
  });

  it('passes through division', () => {
    check(`a /= 1`, `a /= 1;`);
  });

  it('passes through binary OR', () => {
    check(`a |= 1`, `a |= 1;`);
  });

  it('passes through binary AND', () => {
    check(`a &= 1`, `a &= 1;`);
  });

  it('passes through binary XOR', () => {
    check(`a ^= 1`, `a ^= 1;`);
  });

  it('handles compound modulo assignment', () => {
    check(
      `
      a %%= b
    `,
      `
      var a = __mod__(a, b);
      function __mod__(a, b) {
        a = +a;
        b = +b;
        return (a % b + b) % b;
      }
    `
    );
  });

  it('handles compound floor division assignment', () => {
    check(
      `
      a //= b
    `,
      `
      var a = Math.floor(a / b);
    `
    );
  });

  it('handles precedence for floor division assignment', () => {
    check(
      `
      a //= b + c
    `,
      `
      var a = Math.floor(a / (b + c));
    `
    );
  });

  it('handles a repeated LHS in floor division assignment', () => {
    check(
      `
      a[b()] //= c
    `,
      `
      let name;
      a[name = b()] = Math.floor(a[name] / c);
    `
    );
  });

  it('handles compound modulo assignment with a non-repeatable LHS', () => {
    check(
      `
      a[b()] %%= c
    `,
      `
      let name;
      a[name = b()] = __mod__(a[name], c);
      function __mod__(a, b) {
        a = +a;
        b = +b;
        return (a % b + b) % b;
      }
    `
    );
  });

  describe('patching as expressions', () => {
    it('supports LHS identifiers in logical OR', () => {
      check(
        `
        [a ||= b]
      `,
        `
        let a;
        [a || (a = b)];
      `
      );
    });

    it('supports LHS identifiers in logical AND', () => {
      check(
        `
        [a &&= b]
      `,
        `
        let a;
        [a && (a = b)];
      `
      );
    });

    it('supports LHS static member access in logical OR', () => {
      check(
        `
        [a.b ||= c]
      `,
        `
        [a.b || (a.b = c)];
      `
      );
    });

    it('supports LHS static member access in logical AND', () => {
      check(
        `
        [a.b &&= c]
      `,
        `
        [a.b && (a.b = c)];
      `
      );
    });

    it('supports LHS dynamic identifier member access in logical OR', () => {
      check(
        `
        [a[b] ||= c]
      `,
        `
        [a[b] || (a[b] = c)];
      `
      );
    });

    it('supports LHS dynamic identifier member access in logical AND', () => {
      check(
        `
        [a[b] &&= c]
      `,
        `
        [a[b] && (a[b] = c)];
      `
      );
    });

    it('supports LHS dynamic int member access in logical OR', () => {
      check(
        `
        [a[0] ||= c]
      `,
        `
        [a[0] || (a[0] = c)];
      `
      );
    });

    it('supports LHS dynamic int member access in logical AND', () => {
      check(
        `
        [a[0] &&= c]
      `,
        `
        [a[0] && (a[0] = c)];
      `
      );
    });

    it('supports LHS dynamic float member access in logical OR', () => {
      check(
        `
        [a[0.9] ||= c]
      `,
        `
        [a[0.9] || (a[0.9] = c)];
      `
      );
    });

    it('supports LHS dynamic float member access in logical AND', () => {
      check(
        `
        [a[0.9] &&= c]
      `,
        `
        [a[0.9] && (a[0.9] = c)];
      `
      );
    });

    it('supports LHS dynamic index side-effect member access in logical OR', () => {
      check(
        `
        [a[b()] ||= c]
      `,
        `
        let name;
        [a[name = b()] || (a[name] = c)];
      `
      );
    });

    it('supports LHS dynamic index side-effect member access in logical AND', () => {
      check(
        `
        [a[b()] &&= c]
      `,
        `
        let name;
        [a[name = b()] && (a[name] = c)];
      `
      );
    });

    it('supports LHS dynamic base side-effect member access in logical OR', () => {
      check(
        `
        [a()[c] ||= d]
      `,
        `
        let base;
        [(base = a())[c] || (base[c] = d)];
      `
      );
    });

    it('supports LHS dynamic base side-effect member access in logical AND', () => {
      check(
        `
        [a()[c] &&= d]
      `,
        `
        let base;
        [(base = a())[c] && (base[c] = d)];
      `
      );
    });

    it('supports LHS dynamic base and index side-effect member access in logical OR', () => {
      check(
        `
        [a()[b()] ||= c]
      `,
        `
        let base, name;
        [(base = a())[name = b()] || (base[name] = c)];
      `
      );
    });

    it('supports LHS dynamic base and index side-effect member access in logical AND', () => {
      check(
        `
        [a()[b()] &&= c]
      `,
        `
        let base, name;
        [(base = a())[name = b()] && (base[name] = c)];
      `
      );
    });

    it('ensures names do not collide when introducing new variables', () => {
      check(
        `
        name = 'abc'
        [a[b()] ||= c]
      `,
        `
        let name1;
        const name = 'abc';
        [a[name1 = b()] || (a[name1] = c)];
      `
      );
    });

    it('handles simple existence assignment of a bound variable', () => {
      check(
        `
        a = 1
        [a ?= 2]
      `,
        `
        let a = 1;
        [a != null ? a : (a = 2)];
      `
      );
    });

    it('handles simple member expression existence assignment', () => {
      check(
        `
        [a.b ?= 1]
      `,
        `
        [a.b != null ? a.b : (a.b = 1)];
      `
      );
    });

    it('handles simple computed member expression existence assignment', () => {
      check(
        `
        [a[b] ?= 1]
      `,
        `
        [a[b] != null ? a[b] : (a[b] = 1)];
      `
      );
    });

    it('handles computed member expression existence assignment with unsafe-to-repeat key', () => {
      check(
        `
        [a[b()] ?= 1]
      `,
        `
        let name;
        [a[name = b()] != null ? a[name] : (a[name] = 1)];
      `
      );
    });

    it('handles member expression existence assignment with unsafe-to-repeat object', () => {
      check(
        `
        [a()[b] ?= 1]
      `,
        `
        let base;
        [(base = a())[b] != null ? base[b] : (base[b] = 1)];
      `
      );
    });

    it('handles member expression existence assignment with unsafe-to-repeat key and object', () => {
      check(
        `
        [a()[b()] ?= 1]
      `,
        `
        let base, name;
        [(base = a())[name = b()] != null ? base[name] : (base[name] = 1)];
      `
      );
    });

    it('handles `this` as a safe-to-repeat base', () => {
      check(
        `
        [@a or= 0]
      `,
        `
        [this.a || (this.a = 0)];
      `
      );
    });

    it('handles negated logical compound assignments', () => {
      check(
        `
        a = 1
        unless a ||= b
          c
      `,
        `
        let a = 1;
        if (!(a || (a = b))) {
          c;
        }
      `
      );
    });

    it('handles negated exists compound assignments', () => {
      check(
        `
        a = 1
        unless a ?= b
          c
      `,
        `
        let a = 1;
        if (!(a != null ? a : (a = b))) {
          c;
        }
      `
      );
    });

    it('handles negated modulo compound assignments', () => {
      check(
        `
        a = 1
        unless a %%= b
          c
      `,
        `
        let a = 1;
        if (!(a = __mod__(a, b))) {
          c;
        }
        function __mod__(a, b) {
          a = +a;
          b = +b;
          return (a % b + b) % b;
        }
      `
      );
    });
  });

  describe('patching as statements', () => {
    it('supports LHS identifiers in logical OR', () => {
      check(
        `
        a ||= b
      `,
        `
        if (!a) { var a = b; }
      `
      );
    });

    it('supports LHS identifiers in logical AND', () => {
      check(
        `
        a &&= b
      `,
        `
        if (a) { var a = b; }
      `
      );
    });

    it('supports LHS static member access in logical OR', () => {
      check(
        `
        a.b ||= c
      `,
        `
        if (!a.b) { a.b = c; }
      `
      );
    });

    it('supports LHS static member access in logical AND', () => {
      check(
        `
        a.b &&= c
      `,
        `
        if (a.b) { a.b = c; }
      `
      );
    });

    it('supports LHS dynamic identifier member access in logical OR', () => {
      check(
        `
        a[b] ||= c
      `,
        `
        if (!a[b]) { a[b] = c; }
      `
      );
    });

    it('supports LHS dynamic identifier member access in logical AND', () => {
      check(
        `
        a[b] &&= c
      `,
        `
        if (a[b]) { a[b] = c; }
      `
      );
    });

    it('supports LHS dynamic int member access in logical OR', () => {
      check(
        `
        a[0] ||= c
      `,
        `
        if (!a[0]) { a[0] = c; }
      `
      );
    });

    it('supports LHS dynamic int member access in logical AND', () => {
      check(
        `
        a[0] &&= c
      `,
        `
        if (a[0]) { a[0] = c; }
      `
      );
    });

    it('supports LHS dynamic float member access in logical OR', () => {
      check(
        `
        a[0.9] ||= c
      `,
        `
        if (!a[0.9]) { a[0.9] = c; }
      `
      );
    });

    it('supports LHS dynamic float member access in logical AND', () => {
      check(
        `
        a[0.9] &&= c
      `,
        `
        if (a[0.9]) { a[0.9] = c; }
      `
      );
    });

    it('supports LHS dynamic index side-effect member access in logical OR', () => {
      check(
        `
        a[b()] ||= c
      `,
        `
        let name;
        if (!a[name = b()]) { a[name] = c; }
      `
      );
    });

    it('supports LHS dynamic index side-effect member access in logical AND', () => {
      check(
        `
        a[b()] &&= c
      `,
        `
        let name;
        if (a[name = b()]) { a[name] = c; }
      `
      );
    });

    it('supports LHS dynamic base side-effect member access in logical OR', () => {
      check(
        `
        a()[c] ||= d
      `,
        `
        let base;
        if (!(base = a())[c]) { base[c] = d; }
      `
      );
    });

    it('supports LHS dynamic base side-effect member access in logical AND', () => {
      check(
        `
        a()[c] &&= d
      `,
        `
        let base;
        if ((base = a())[c]) { base[c] = d; }
      `
      );
    });

    it('supports LHS dynamic base and index side-effect member access in logical OR', () => {
      check(
        `
        a()[b()] ||= c
      `,
        `
        let base, name;
        if (!(base = a())[name = b()]) { base[name] = c; }
      `
      );
    });

    it('supports LHS dynamic base and index side-effect member access in logical AND', () => {
      check(
        `
        a()[b()] &&= c
      `,
        `
        let base, name;
        if ((base = a())[name = b()]) { base[name] = c; }
      `
      );
    });

    it('ensures names do not collide when introducing new variables', () => {
      check(
        `
        name = 'abc'
        a[b()] ||= c
      `,
        `
        let name1;
        const name = 'abc';
        if (!a[name1 = b()]) { a[name1] = c; }
      `
      );
    });

    it('handles simple existence assignment', () => {
      check(
        `
        a = 1
        a ?= 2
      `,
        `
        let a = 1;
        if (a == null) { a = 2; }
      `
      );
    });

    it('handles simple existence assignment to an undeclared variable', () => {
      check(
        `
        a ?= 2
        console.log a
      `,
        `
        let a;
        if (typeof a === 'undefined' || a === null) { a = 2; }
        console.log(a);
      `
      );
    });

    it('handles simple member expression existence assignment', () => {
      check(
        `
        a.b ?= 1
      `,
        `
        if (a.b == null) { a.b = 1; }
      `
      );
    });

    it('handles existence assignment within a conditional', () => {
      check(
        `
        if a then b ?= c
      `,
        `
        if (a) { if (typeof b === 'undefined' || b === null) { var b = c; } }
      `
      );
    });

    it('handles simple computed member expression existence assignment', () => {
      check(
        `
        a[b] ?= 1
      `,
        `
        if (a[b] == null) { a[b] = 1; }
      `
      );
    });

    it('handles computed member expression existence assignment with unsafe-to-repeat key', () => {
      check(
        `
        a[b()] ?= 1
      `,
        `
        let name;
        if (a[name = b()] == null) { a[name] = 1; }
      `
      );
    });

    it('handles member expression existence assignment with unsafe-to-repeat object', () => {
      check(
        `
        a()[b] ?= 1
      `,
        `
        let base;
        if ((base = a())[b] == null) { base[b] = 1; }
      `
      );
    });

    it('handles member expression existence assignment with unsafe-to-repeat key and object', () => {
      check(
        `
        a()[b()] ?= 1
      `,
        `
        let base, name;
        if ((base = a())[name = b()] == null) { base[name] = 1; }
      `
      );
    });

    it('handles existence assignment with a soak lhs', () => {
      check(
        `
        a.b?.c ?= d
      `,
        `
        if (a.b != null) {
          a.b.c != null ? a.b.c : (a.b.c = d);
        }
      `
      );
    });

    it('patches children', () => {
      check(
        `
        (a or b).c or= d or e
      `,
        `
        let base;
        if (!((base = a || b)).c) { base.c = d || e; }
      `
      );
    });

    it('handles `this` as a safe-to-repeat base', () => {
      check(
        `
        @a or= 0
      `,
        `
        if (!this.a) { this.a = 0; }
      `
      );
    });

    it('handles logical operators with a function on the right side', () => {
      check(
        `
        a or= -> b
      `,
        `
        if (!a) { var a = () => b; }
      `
      );
    });
  });
});
