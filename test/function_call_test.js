import check from './support/check';

describe('function calls', () => {
  it('works when the first argument is parenthesized', () => {
    check(`
      f (1+1),2+2
    `, `
      f((1+1),2+2);
    `);
  });

  it('works when the last argument is parenthesized', () => {
    check(`
      f 1+1,(2+2)
    `, `
      f(1+1,(2+2));
    `);
  });

  it('works with `new` when the first argument is parenthesized', () => {
    check(`
      a= new c ([b()])
    `, `
      var a= new c(([b()]));
    `);
  });
});
