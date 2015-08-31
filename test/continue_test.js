import check from './support/check';

describe('continue', () => {
  it('is passed through as-is', () => {
    check(`
      for a in b
        continue
    `, `
      for (var i = 0, a; i < b.length; i++) {
        a = b[i];
        continue;
      }
    `);
  });
});
