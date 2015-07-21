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

  it('supports LHS identifiers in logical OR', () => {
    check(`
      a ||= b
    `, `
      var a;
      a || (a = b);
    `);
  });

  it('supports LHS identifiers in logical AND', () => {
    check(`
      a &&= b
    `, `
      var a;
      a && (a = b);
    `);
  });

  it('supports LHS static member access in logical OR', () => {
    check(`
      a.b ||= c
    `, `
      a.b || (a.b = c);
    `);
  });

  it('supports LHS static member access in logical AND', () => {
    check(`
      a.b &&= c
    `, `
      a.b && (a.b = c);
    `);
  });

  it('supports LHS dynamic identifier member access in logical OR', () => {
    check(`
      a[b] ||= c
    `, `
      a[b] || (a[b] = c);
    `);
  });

  it('supports LHS dynamic identifier member access in logical AND', () => {
    check(`
      a[b] &&= c
    `, `
      a[b] && (a[b] = c);
    `);
  });

  it('supports LHS dynamic int member access in logical OR', () => {
    check(`
      a[0] ||= c
    `, `
      a[0] || (a[0] = c);
    `);
  });

  it('supports LHS dynamic int member access in logical AND', () => {
    check(`
      a[0] &&= c
    `, `
      a[0] && (a[0] = c);
    `);
  });

  it('supports LHS dynamic float member access in logical OR', () => {
    check(`
      a[0.9] ||= c
    `, `
      a[0.9] || (a[0.9] = c);
    `);
  });

  it('supports LHS dynamic float member access in logical AND', () => {
    check(`
      a[0.9] &&= c
    `, `
      a[0.9] && (a[0.9] = c);
    `);
  });

  it('supports LHS dynamic side-effect member access in logical OR', () => {
    check(`
      a[b()] ||= c
    `, `
      var name;
      a[name = b()] || (a[name] = c);
    `);
  });

  it('supports LHS dynamic side-effect member access in logical AND', () => {
    check(`
      a[b()] &&= c
    `, `
      var name;
      a[name = b()] && (a[name] = c);
    `);
  });

  it('supports LHS dynamic side-effect member access in logical OR', () => {
    check(`
      a.b[c()] ||= d
    `, `
      var name;
      a.b[name = c()] || (a.b[name] = d);
    `);
  });

  it('supports LHS dynamic side-effect member access in logical AND', () => {
    check(`
      a.b[c()] &&= d
    `, `
      var name;
      a.b[name = c()] && (a.b[name] = d);
    `);
  });
});
