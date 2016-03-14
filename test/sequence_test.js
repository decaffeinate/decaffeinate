import check from './support/check.js';

describe('sequences', () => {
  it('become JavaScript sequence expressions', () => {
    check(`
      -> return (a; b)
    `, `
      () => (a, b);
    `);
  });

  it('that are nested become JavaScript sequence expressions', () => {
    check(`
      -> return (a; b; c)
    `, `
      () => (a, b, c);
    `);
  });
});
