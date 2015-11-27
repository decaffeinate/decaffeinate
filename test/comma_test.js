import check from './support/check';

describe('commas', () => {
  it('inserts commas after arguments in multi-line `new` expressions', () => {
    check(`
      new Serializer(
        a
        b
      )
    `, `
      new Serializer(
        a,
        b
      );
    `);
  });
});
