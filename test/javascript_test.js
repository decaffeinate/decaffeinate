import check from './support/check';

describe('embedded JavaScript', () => {
  it('strips the backticks off in a statement context', () => {
    check('`var a = 1;`', 'let a = 1;');
  });

  it('strips the backticks off in an expression context', () => {
    check('a = `void 0`', 'let a = void 0;');
  });

  it('allows passing JSX through', () => {
    check('-> `<MyComponent />`', '() => <MyComponent />;');
  });
});
