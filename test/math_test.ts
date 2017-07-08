import check from './support/check';

describe('division', () => {
  it('is passed through', () => {
    check(`
      a / b
    `, `
      a / b;
    `);
  });

  it('transforms left and right', () => {
    check(`
      (a b) / (c d)
    `, `
      (a(b)) / (c(d));
    `);
  });
});

describe('multiplication', () => {
  it('is passed through', () => {
    check(`
      a * b
    `, `
      a * b;
    `);
  });

  it('transforms left and right', () => {
    check(`
      (a b) * (c d)
    `, `
      (a(b)) * (c(d));
    `);
  });
});

describe('remainder', () => {
  it('is passed through', () => {
    check(`
      a % b
    `, `
      a % b;
    `);
  });

  it('transforms left and right', () => {
    check(`
      (a b) % (c d)
    `, `
      (a(b)) % (c(d));
    `);
  });
});

describe('floor division', () => {
  it('wraps division in a `Math.floor` call', () => {
    check(`
      a // b
    `, `
      Math.floor(a / b);
    `);
  });

  it('transforms left and right', () => {
    check(`
      (a b) // (c d)
    `, `
      Math.floor((a(b)) / (c(d)));
    `);
  });
});

describe('exponentiation', () => {
  it('wraps exponentiation in a `Math.pow` call', () => {
    check(`
      (a b) ** (c d)
    `, `
      Math.pow((a(b)), (c(d)));
    `);
  });
});
