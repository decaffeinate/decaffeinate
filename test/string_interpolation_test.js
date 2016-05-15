import check from './support/check.js';

describe('string interpolation', () => {
  it('rewrites interpolations with #{} to ${}', () => {
    check('"a#{b}c"', '`a${b}c`;');
  });

  it('rewrites interpolations with spaces after the "{"', () => {
    check('"a#{ b }c"', '`a${ b }c`;');
  });

  it('can return interpolated strings', () => {
    check('-> "#{a}"', '() => `${a}`;');
  });

  it('ensures backticks are escaped', () => {
    check('"`#{name}` is required"', '`\\`${name}\\` is required`;');
  });

  it('does not double-escape backticks', () => {
    check('"\\`#{name}\\` is required"', '`\\`${name}\\` is required`;');
  });

  it('handles multi-line triple-quoted strings correctly', () => {
    check('a = """\n     #{b}\n     c\n    """', 'let a = `${b}\nc`;');
  });

  it('handles double quotes inside triple-double quotes', () => {
    check(`
      a="""
      bar="#{bar}"
      """
    `, `
      let a=\`bar="\${bar}"\`;
    `);
  });

  it('handles comments inside interpolations', () => {
    check(`
      a="#{
      b # foo!
      }"
    `, `
      let a=\`\${
      b // foo!
      }\`;
    `);
  });

  it('handles nested string interpolations', () => {
    check(`
      "a#{"b#{c}d"}e"
    `, `
      \`a\${\`b\${c}d\`}e\`;
    `);
  });

  it('escapes ${ inside strings that become template strings', () => {
    check(
      '"#{interpolation}${not interpolation}"',
      '`${interpolation}\\${not interpolation}`;'
    );
  });

  it('escapes ${ inside block strings that become template strings', () => {
    check(`
      """
      \${a}
      \${b}
      """
    `, `
      \`\\\${a}
      \\\${b}\`;
    `);
  });

  it('is allowed inside an object with explicit curly braces', () => {
    check(`
      { a: "#{b}" }
    `, `
      ({ a: \`\${b}\` });
    `);
  });

  it('works with two string interpolations separated by something', () => {
    check(`
      "#{a} #{b}"
    `, `
      \`\${a} \${b}\`;
    `);
  });

  it('joins multi line doubled quoted strings on new lines and removes indentation with variable interpolation', () => {
    check(`
     a = "multi line
          double\\nquote
          #{variable}"
     `, `
     let a = \`multi line double\\nquote \${variable}\`;
     `);
  });

  it('joins multi line single quoted strings on new lines and removes indentation without variable interpolation', () => {
    check(`
     a = 'multi line
          double\\nquote
          #{variable}'
     `, `
     let a = \`multi line double\\nquote \#{variable}\`;
     `);
  });
});
