import check from './support/check';

describe('binary operators', () => {
  it('passes subtraction through', () => {
    check(`
      a - b
    `, `
      a - b;
    `);
  });

  it('passes bitwise `and` through', () => {
    check(`
      a & b
    `, `
      a & b;
    `);
  });

  it('passes bitwise `xor` through', () => {
    check(`
      a ^ b
    `, `
      a ^ b;
    `);
  });

  it('passes compound subtraction and bitwise `and` through', () => {
    check(`
      a - b & c
      a & b - c
    `, `
      (a - b) & c;
      a & (b - c);
    `);
  });

  it('passes compound subtraction and bitwise `or` through', () => {
    check(`
      a - b | c
      a | b - c
    `, `
      (a - b) | c;
      a | (b - c);
    `);
  });

  it('passes left shift through', () => {
    check(`
      a << b
    `, `
      a << b;
    `);
  });

  it('passes signed right shift through', () => {
    check(`
      a >> b
    `, `
      a >> b;
    `);
  });

  it('passes unsigned right shift through', () => {
    check(`
      a >>> b
    `, `
      a >>> b;
    `);
  });

  it('passes chained logical `or` through', () => {
    check(`
      a || b || c
    `, `
      a || b || c;
    `);
  });

  it('handles binary existence operator with a global LHS as a statement', () => {
    check(`
      a ? b
    `, `
      if (typeof a === 'undefined' || a === null) { b; }
    `);
  });

  it('handles binary existence operator with a global LHS as an expression', () => {
    check(`
      (a ? b)
    `, `
      (typeof a !== 'undefined' && a !== null ? a : b);
    `);
  });

  it('handles binary existence operator with a safe-to-repeat member expression as a statement', () => {
    check(`
      a.b ? a
    `, `
      if (a.b == null) { a; }
    `);
  });

  it('handles binary existence operator with a `this` accesses', () => {
    check(`
      @a ? @b
    `, `
      if (this.a == null) { this.b; }
    `);
  });

  it('handles binary existence operator with a `this` access on the right side', () => {
    check(`
      a ? @b
    `, `
      if (typeof a === 'undefined' || a === null) { this.b; }
    `);
  });

  it('handles binary existence operator with a safe-to-repeat member expression as an expression', () => {
    check(`
      (a.b ? a)
    `, `
      (a.b != null ? a.b : a);
    `);
  });

  it('handles binary existence operator with an unsafe-to-repeat member expression as a statement', () => {
    check(`
      a() ? b
    `, `
      if (a() == null) { b; }
    `);
  });

  it('handles binary existence operator with an unsafe-to-repeat member expression as an expression', () => {
    check(`
      (a() ? b)
    `, `
      let left;
      ((left = a()) != null ? left : b);
    `);
  });

  it.skip('deals gracefully with extra parens in simple binary existential operators', () => {
    check(`a ? (b)`, `if ((typeof a !== "undefined" && a !== null)) { a; } else { b; }`);
  });

  it.skip('deals gracefully with extra parens in complex binary existential operators', () => {
    check(
      `@a ? (@b)`,
      `
         var ref;
         if (((ref = this.a) != null)) { ref; } else { this.b; }
        `
    );
  });

  it('prevents using temporary variables that clash with existing bindings', () => {
    check(`
        left = 1
        x = a() ? @b
      `, `
        let left1;
        let left = 1;
        let x = (left1 = a()) != null ? left1 : this.b;
      `);
  });

  it('prevents using temporary variables that clash with existing temporary variables', () => {
    check(`
        x = a() ? @b
        y = c() ? @d
      `, `
        let left, left1;
        let x = (left = a()) != null ? left : this.b;
        let y = (left1 = c()) != null ? left1 : this.d;
      `);
  });

  it('handles binary existence operator combined with plus', () => {
    check(`
      x = 1 + (y ? 0)
    `, `
      let x = 1 + (typeof y !== 'undefined' && y !== null ? y : 0);
    `);
  });

  it('handles left shift as a nested operator', () => {
    check(`
      value = object.id << 8 | object.type
    `, `
      let value = (object.id << 8) | object.type;
    `);
  });

  it('handles modulo operator', () => {
    check(`
      a %% b
    `, `
      __mod__(a, b);
      function __mod__(a, b) {
        a = +a;
        b = +b;
        return (a % b + b) % b;
      }
    `);
  });

  it('handles modulo operator applied multiple times', () => {
    check(`
      a(b() %% c(d) %% e + f)
    `, `
      a(__mod__(__mod__(b(), c(d)), e) + f);
      function __mod__(a, b) {
        a = +a;
        b = +b;
        return (a % b + b) % b;
      }
    `);
  });

  it('handles `extends` operator', () => {
    check(`
      a extends b
    `, `
      __extends__(a, b);
      function __extends__(child, parent) {
        Object.getOwnPropertyNames(parent).forEach(
          name => child[name] = parent[name]
        );
        child.prototype = Object.create(parent.prototype);
        child.__super__ = parent.prototype;
        return child;
      }
    `);
  });
});
