import check from './support/check';

describe('embedded JavaScript', () => {
  it('strips the backticks off in a statement context', () => {
    check('`var a = 1;`', 'var a = 1;');
  });

  it('strips the backticks off in an expression context', () => {
    check('a = `void 0`', 'var a = void 0;');
  });
});
