import check from './support/check';

describe('unary operators', () => {
  it('passes bitwise negation through', () => {
    check(`
      ~0
    `, `
      ~0;
    `);
  });
});
