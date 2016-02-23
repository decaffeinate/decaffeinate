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
