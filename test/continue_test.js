import check from './support/check';

describe('continue', () => {
  it('is passed through as-is', () => {
    check(`
      for a in b
        continue
    `, `
      for a in b
        continue;
    `);
  });
});
