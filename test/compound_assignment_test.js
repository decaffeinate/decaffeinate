import check from './support/check.js';

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

  describe('patching as expressions', () => {
    it('supports LHS identifiers in logical OR', () => {
      check(`
        [a ||= b]
      `, `
        let a;
        [a || (a = b)];
      `);
    });

    it('supports LHS identifiers in logical AND', () => {
      check(`
        [a &&= b]
      `, `
        let a;
        [a && (a = b)];
      `);
    });

    it('supports LHS static member access in logical OR', () => {
      check(`
        [a.b ||= c]
      `, `
        [a.b || (a.b = c)];
      `);
    });

    it('supports LHS static member access in logical AND', () => {
      check(`
        [a.b &&= c]
      `, `
        [a.b && (a.b = c)];
      `);
    });

    it('supports LHS dynamic identifier member access in logical OR', () => {
      check(`
        [a[b] ||= c]
      `, `
        [a[b] || (a[b] = c)];
      `);
    });

    it('supports LHS dynamic identifier member access in logical AND', () => {
      check(`
        [a[b] &&= c]
      `, `
        [a[b] && (a[b] = c)];
      `);
    });

    it('supports LHS dynamic int member access in logical OR', () => {
      check(`
        [a[0] ||= c]
      `, `
        [a[0] || (a[0] = c)];
      `);
    });

    it('supports LHS dynamic int member access in logical AND', () => {
      check(`
        [a[0] &&= c]
      `, `
        [a[0] && (a[0] = c)];
      `);
    });

    it('supports LHS dynamic float member access in logical OR', () => {
      check(`
        [a[0.9] ||= c]
      `, `
        [a[0.9] || (a[0.9] = c)];
      `);
    });

    it('supports LHS dynamic float member access in logical AND', () => {
      check(`
        [a[0.9] &&= c]
      `, `
        [a[0.9] && (a[0.9] = c)];
      `);
    });

    it('supports LHS dynamic index side-effect member access in logical OR', () => {
      check(`
        [a[b()] ||= c]
      `, `
        let name;
        [a[name = b()] || (a[name] = c)];
      `);
    });

    it('supports LHS dynamic index side-effect member access in logical AND', () => {
      check(`
        [a[b()] &&= c]
      `, `
        let name;
        [a[name = b()] && (a[name] = c)];
      `);
    });

    it('supports LHS dynamic base side-effect member access in logical OR', () => {
      check(`
        [a()[c] ||= d]
      `, `
        let base;
        [(base = a())[c] || (base[c] = d)];
      `);
    });

    it('supports LHS dynamic base side-effect member access in logical AND', () => {
      check(`
        [a()[c] &&= d]
      `, `
        let base;
        [(base = a())[c] && (base[c] = d)];
      `);
    });

    it('supports LHS dynamic base and index side-effect member access in logical OR', () => {
      check(`
        [a()[b()] ||= c]
      `, `
        let base;
        let name;
        [(base = a())[name = b()] || (base[name] = c)];
      `);
    });

    it('supports LHS dynamic base and index side-effect member access in logical AND', () => {
      check(`
        [a()[b()] &&= c]
      `, `
        let base;
        let name;
        [(base = a())[name = b()] && (base[name] = c)];
      `);
    });

    it('ensures names do not collide when introducing new variables', () => {
      check(`
        name = 'abc'
        [a[b()] ||= c]
      `, `
        let name1;
        let name = 'abc';
        [a[name1 = b()] || (a[name1] = c)];
      `);
    });

    it('handles simple existence assignment of a bound variable', () => {
      check(`
        a = 1
        [a ?= 2]
      `, `
        let a = 1;
        [a != null ? a : (a = 2)];
      `);
    });

    it('handles simple member expression existence assignment', () => {
      check(`
        [a.b ?= 1]
      `, `
        [a.b != null ? a.b : (a.b = 1)];
      `);
    });

    it('handles simple computed member expression existence assignment', () => {
      check(`
        [a[b] ?= 1]
      `, `
        [a[b] != null ? a[b] : (a[b] = 1)];
      `);
    });

    it('handles computed member expression existence assignment with unsafe-to-repeat key', () => {
      check(`
        [a[b()] ?= 1]
      `, `
        let name;
        [a[name = b()] != null ? a[name] : (a[name] = 1)];
      `);
    });

    it('handles member expression existence assignment with unsafe-to-repeat object', () => {
      check(`
        [a()[b] ?= 1]
      `, `
        let base;
        [(base = a())[b] != null ? base[b] : (base[b] = 1)];
      `);
    });

    it('handles member expression existence assignment with unsafe-to-repeat key and object', () => {
      check(`
        [a()[b()] ?= 1]
      `, `
        let base;
        let name;
        [(base = a())[name = b()] != null ? base[name] : (base[name] = 1)];
      `);
    });

    it('handles `this` as a safe-to-repeat base', () => {
      check(`
        [@a or= 0]
      `, `
        [this.a || (this.a = 0)];
      `);
    });
  });

  describe('patching as statements', () => {
    it('supports LHS identifiers in logical OR', () => {
      check(`
        a ||= b
      `, `
        if (!a) { var a = b; }
      `);
    });

    it('supports logical OR containing a space', () => {
      check(`
        a or = b
      `, `
        if (!a) { var a = b; }
      `);
    });

    it('supports LHS identifiers in logical AND', () => {
      check(`
        a &&= b
      `, `
        if (a) { var a = b; }
      `);
    });

    it('supports LHS static member access in logical OR', () => {
      check(`
        a.b ||= c
      `, `
        if (!a.b) { a.b = c; }
      `);
    });

    it('supports LHS static member access in logical AND', () => {
      check(`
        a.b &&= c
      `, `
        if (a.b) { a.b = c; }
      `);
    });

    it('supports LHS dynamic identifier member access in logical OR', () => {
      check(`
        a[b] ||= c
      `, `
        if (!a[b]) { a[b] = c; }
      `);
    });

    it('supports LHS dynamic identifier member access in logical AND', () => {
      check(`
        a[b] &&= c
      `, `
        if (a[b]) { a[b] = c; }
      `);
    });

    it('supports LHS dynamic int member access in logical OR', () => {
      check(`
        a[0] ||= c
      `, `
        if (!a[0]) { a[0] = c; }
      `);
    });

    it('supports LHS dynamic int member access in logical AND', () => {
      check(`
        a[0] &&= c
      `, `
        if (a[0]) { a[0] = c; }
      `);
    });

    it('supports LHS dynamic float member access in logical OR', () => {
      check(`
        a[0.9] ||= c
      `, `
        if (!a[0.9]) { a[0.9] = c; }
      `);
    });

    it('supports LHS dynamic float member access in logical AND', () => {
      check(`
        a[0.9] &&= c
      `, `
        if (a[0.9]) { a[0.9] = c; }
      `);
    });

    it('supports LHS dynamic index side-effect member access in logical OR', () => {
      check(`
        a[b()] ||= c
      `, `
        let name;
        if (!a[name = b()]) { a[name] = c; }
      `);
    });

    it('supports LHS dynamic index side-effect member access in logical AND', () => {
      check(`
        a[b()] &&= c
      `, `
        let name;
        if (a[name = b()]) { a[name] = c; }
      `);
    });

    it('supports LHS dynamic base side-effect member access in logical OR', () => {
      check(`
        a()[c] ||= d
      `, `
        let base;
        if (!(base = a())[c]) { base[c] = d; }
      `);
    });

    it('supports LHS dynamic base side-effect member access in logical AND', () => {
      check(`
        a()[c] &&= d
      `, `
        let base;
        if ((base = a())[c]) { base[c] = d; }
      `);
    });

    it('supports LHS dynamic base and index side-effect member access in logical OR', () => {
      check(`
        a()[b()] ||= c
      `, `
        let base;
        let name;
        if (!(base = a())[name = b()]) { base[name] = c; }
      `);
    });

    it('supports LHS dynamic base and index side-effect member access in logical AND', () => {
      check(`
        a()[b()] &&= c
      `, `
        let base;
        let name;
        if ((base = a())[name = b()]) { base[name] = c; }
      `);
    });

    it('ensures names do not collide when introducing new variables', () => {
      check(`
        name = 'abc'
        a[b()] ||= c
      `, `
        let name1;
        let name = 'abc';
        if (!a[name1 = b()]) { a[name1] = c; }
      `);
    });

    it('handles simple existence assignment', () => {
      check(`
        a = 1
        a ?= 2
      `, `
        let a = 1;
        if (typeof a === 'undefined' || a === null) { a = 2; }
      `);
    });

    it('handles simple member expression existence assignment', () => {
      check(`
        a.b ?= 1
      `, `
        if (a.b == null) { a.b = 1; }
      `);
    });

    it('handles simple computed member expression existence assignment', () => {
      check(`
        a[b] ?= 1
      `, `
        if (a[b] == null) { a[b] = 1; }
      `);
    });

    it('handles computed member expression existence assignment with unsafe-to-repeat key', () => {
      check(`
        a[b()] ?= 1
      `, `
        let name;
        if (a[name = b()] == null) { a[name] = 1; }
      `);
    });

    it('handles member expression existence assignment with unsafe-to-repeat object', () => {
      check(`
        a()[b] ?= 1
      `, `
        let base;
        if ((base = a())[b] == null) { base[b] = 1; }
      `);
    });

    it('handles member expression existence assignment with unsafe-to-repeat key and object', () => {
      check(`
        a()[b()] ?= 1
      `, `
        let base;
        let name;
        if ((base = a())[name = b()] == null) { base[name] = 1; }
      `);
    });

    it('patches children', () => {
      check(`
        (a or b).c or= d or e
      `, `
        let base;
        if (!((base = a || b)).c) { base.c = d || e; }
      `);
    });

    it('handles `this` as a safe-to-repeat base', () => {
      check(`
        @a or= 0
      `, `
        if (!this.a) { this.a = 0; }
      `);
    });

    it('handles logical operators with a function on the right side', () => {
      check(`
        a or= -> b
      `, `
        if (!a) { var a = () => b; }
      `);
    });
  });
});
