import check from './support/check';
import validate from './support/validate';

describe('strings', () => {
  it('changes single-line triple-double-quotes to double-quotes', () => {
    check(`"""a"""`, `"a";`);
  });

  it('escapes double quotes in previously triple-double-quoted strings', () => {
    check(`"""He said, "Welcome!"."""`, `"He said, \\"Welcome!\\".";`);
  });

  it('does not escape already-escaped double quotes in previously triple-double-quoted strings', () => {
    check(`"""He said, \\"Welcome!\\"."""`, `"He said, \\"Welcome!\\".";`);
  });

  it('changes single-line triple-single-quotes to single-quotes', () => {
    check(`'''a'''`, `'a';`);
  });

  it('escapes single quotes in previously triple-single-quoted strings', () => {
    check(`'''It's a nice day'''`, `'It\\'s a nice day';`);
  });

  it('does not escape already-escaped single quotes in previously triple-single-quoted strings', () => {
    check(`'''It\\'s a nice day'''`, `'It\\'s a nice day';`);
  });

  it('changes multi-line triple-double-quotes to backticks', () => {
    check(`"""a\nb"""`, '`a\nb`;');
  });

  it('changes multi-line triple-single-quotes to backticks', () => {
    check(`'''a\nb'''`, '`a\nb`;');
  });

  it('removes a leading newline in triple-quoted strings', () => {
    check(`'''\na'''`, '`\\\na`;');
  });

  it('escapes backticks when changing the quote type', () => {
    check("'''a\n`'''", '`a\n\\``;');
  });

  it('strips shared leading spaces for each line of multi-line triple-quoted strings', () => {
    check('"""\n  a\n  b\n   c\n"""', '`\\\na\nb\n c\\\n`;');
  });

  it('ignores empty lines for indent-stripping purposes', () => {
    check('"""\n  a\n\n   c\n"""', '`\\\na\n\n c\\\n`;');
  });

  it('works with multi-line strings containing all empty lines by stripping the first and last', () => {
    check('"""\n\n\n\n"""', '`\\\n\n\n\\\n`;');
  });

  it('works when the triple-quoted string is indented', () => {
    check(
      `
      a = """
           foo
           bar
          """
    `,
      `
      const a = \`\\
      foo
      bar\\
      \`;
    `,
    );
  });

  it('appends semicolons after the parentheses of a function call with a triple-double-quoted multi-line string as argument', () => {
    check(
      `
      a("""line1
      line2""")
    `,
      `
      a(\`line1
      line2\`);
    `,
    );
  });

  it('appends semicolons after the parentheses of a function call with a triple-single-quoted multi-line string as argument', () => {
    check(
      `
      a('''line1
      line2''')
    `,
      `
      a(\`line1
      line2\`);
    `,
    );
  });

  it('converts multi line string assignment', () => {
    check(
      `
      a = "this is a 
           multi line
           string"
      `,
      `
      const a = \`this is a \\
      multi line \\
      string\`;
    `,
    );
  });

  it('converts multi line string in function call', () => {
    check(
      `
      fn("this is a 
          multi line
          string")
      `,
      `
      fn(\`this is a \\
      multi line \\
      string\`);
    `,
    );
  });

  it('allows escaping newlines in double-quoted strings', () => {
    check(
      `
      a = "a\\
      b"
      `,
      `
      const a = \`a\\
      b\`;
    `,
    );
  });

  it('escapes \\u2028 within strings', () => {
    check(
      `
      '\u2028'
      `,
      `
      '\\u2028';
    `,
    );
  });

  it('escapes \\u2029 within strings', () => {
    check(
      `
      '\u2029'
      `,
      `
      '\\u2029';
    `,
    );
  });

  it('uses the existing escape character for escaped \\u2028', () => {
    check(
      `
      '\\\u2028'
      `,
      `
      '\\u2028';
    `,
    );
  });

  it('leaves an escaped backslash when an escaped backslash is followed by \\u2028', () => {
    check(
      `
      '\\\\\u2028'
      `,
      `
      '\\\\\\u2028';
    `,
    );
  });

  it('handles \\0 followed by a number', () => {
    validate(
      `
      setResult('
        \\0\\
        1
      ')
      `,
      '\x001',
    );
  });
});
