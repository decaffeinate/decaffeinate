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
      a - b & c;
      a & b - c;
    `);
  });

  it('passes compound subtraction and bitwise `or` through', () => {
    check(`
      a - b | c
      a | b - c
    `, `
      a - b | c;
      a | b - c;
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

  it('handles left shift as a nested operator', () => {
    check(`
      value = object.id << 8 | object.type
    `, `
      var value = object.id << 8 | object.type;
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
