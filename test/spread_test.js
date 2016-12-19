import check from './support/check';

describe('spread', () => {
  it('moves the ellipsis to before the expression in function calls', () => {
    check(`a(b...)`, `a(...b);`);
    check(`a(1, 2, makeArray(arguments...)...)`, `a(1, 2, ...makeArray(...arguments));`);
  });

  it('moves the ellipsis to before the expression in array literals', () => {
    check(`[b...]`, `[...b];`);
    check(`[1, 2, makeArray(arguments...)...]`, `[1, 2, ...makeArray(...arguments)];`);
  });
});
