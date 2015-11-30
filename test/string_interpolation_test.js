import check from './support/check';

describe('string interpolation', () => {
  it('ensures backticks are escaped', () => {
    check('"`#{name}` is required"', '`\\`${name}\\` is required`;');
  });

  it('does not double-escape backticks', () => {
    check('"\\`#{name}\\` is required"', '`\\`${name}\\` is required`;');
  });

  it('handles multi-line triple-quoted strings correctly', () => {
    check('a = """\n     #{b}\n     c\n    """', 'var a = `${b}\nc`;')
  });
});
