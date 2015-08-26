import check from './support/check';

describe('for loops', () => {
  it('transforms basic for-of loops into for-in', () => {
    check(`
      for k of o
        k
    `, `
      for (var k in o) {
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value into for-in', () => {
    check(`
      for k, v of o
        k
    `, `
      for (var k in o) {
        var v = o[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value plus unsafe-to-repeat target by saving a reference', () => {
    check(`
      for k, v of object()
        k
    `, `
      var iterable;
      for (var k in (iterable = object())) {
        var v = iterable[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with destructured keys', () => {
    check(`
      for {a, b} of o
        a + b
    `, `
      for (var {a, b} in o) {
        a + b;
      }
    `);
  });

  it('transforms for-of loops with destructured keys and values', () => {
    check(`
      for {a, b}, {x, y} of o
        a + x
    `, `
      for (var key in o) {
        var {a, b} = key;
        var {x, y} = o[key];
        a + x;
      }
    `);
  });

  it('transforms for-of loops with destructured keys and values plus unsafe-to-repeat target', () => {
    check(`
      for {a, b}, {x, y} of object()
        a + x
    `, `
      var iterable;
      for (var key in (iterable = object())) {
        var {a, b} = key;
        var {x, y} = iterable[key];
        a + x;
      }
    `);
  });
});
