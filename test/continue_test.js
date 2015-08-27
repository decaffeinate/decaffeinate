import check from './support/check';

describe('continue', () => {
  it('is passed through as-is', () => {
    check(`
      for a in b
        continue
    `, `
      for (var a, i = 0; i < b.length; i++) {
        a = b[i];
        continue;
      }
    `);
  });
});
