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

  it('transforms for-in loops to typical `for` loops', () => {
    check(`
      for a in b
        a
    `, `
      for (var a, i = 0; i < b.length; i++) {
        a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in by a specific step size', () => {
    check(`
      for a in b by 2
        a
    `, `
      for (var a, i = 0; i < b.length; i += 2) {
        a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in in reverse', () => {
    check(`
      for a in b by -1
        a
    `, `
      for (var a, i = b.length - 1; i >= 0; i--) {
        a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in in reverse with a specific step size', () => {
    check(`
      for a in b by -2
        a
    `, `
      for (var a, i = b.length - 1; i >= 0; i -= 2) {
        a = b[i];
        a;
      }
    `);
  });
});
