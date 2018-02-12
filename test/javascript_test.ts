import check from './support/check';
import validate from './support/validate';

describe('embedded JavaScript', () => {
  it('strips the backticks off in a statement context', () => {
    check('`var a = 1;`', 'const a = 1;');
  });

  it('strips the backticks off in an expression context', () => {
    check('a = `void 0`', 'const a = void 0;');
  });

  it('allows passing JSX through', () => {
    check('-> `<MyComponent />`', '() => <MyComponent />;');
  });

  it('handles comment-only inline JS surrounded by parens', () => {
    check('a = (`/** comment */`) b', 'const a = /** comment */(b);');
  });

  it('treats comment-only inline JS as an expression', () => {
    check('f `/*foo*/`', 'f(/*foo*/);');
  });

  it('removes parens around inline JS even when it would cause precedence issues', () => {
    validate('setResult(10 - (`5 + 3`))', 8);
  });

  it('handles triple-backtick embedded JS', () => {
    check('```a + b;```', 'a + b;');
  });

  it('handles escaped backticks in inline JS', () => {
    check('`s + \\`hello\\`;`', 's + `hello`;');
  });
});
