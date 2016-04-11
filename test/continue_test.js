import check from './support/check.js';

describe('continue', () => {
  it('is passed through as-is', () => {
    check(`
      for a in b
        continue
    `, `
      for (let i = 0; i < b.length; i++) {
        let a = b[i];
        continue;
      }
    `);
  });
});
