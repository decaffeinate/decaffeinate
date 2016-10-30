import check from './support/check.js';

describe('continue', () => {
  it('is passed through as-is', () => {
    check(`
      for a in b
        continue
    `, `
      for (let a of b) {
        continue;
      }
    `);
  });
});
