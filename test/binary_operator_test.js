import check from './support/check.js';

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

  it('handles left shift as a nested operator', () => {
    check(`
      value = object.id << 8 | object.type
    `, `
      let value = (object.id << 8) | object.type;
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
