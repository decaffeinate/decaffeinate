import check from './support/check';

describe('`new` operator', () => {
  it('inserts missing commas after arguments', () => {
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

  it('inserts missing parentheses in a call with arguments', () => {
    check(`
      new Array 1
    `, `
      new Array(1);
    `);
  });

  it('inserts missing parentheses in a call with no arguments', () => {
    check(`
      new Object
    `, `
      new Object();
    `);
  });
});
