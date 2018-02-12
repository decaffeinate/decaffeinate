import check from './support/check';

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
    check('a = """\n     #{b}\n     c\n    """', 'const a = `\\\n${b}\nc\\\n`;');
  });

  it('handles double quotes inside triple-double quotes', () => {
    check(`
      a="""
      bar="#{bar}"
      """
    `, `
      const a=\`\\
      bar="\${bar}"\\
      \`;
    `);
  });

  it('handles comments inside interpolations', () => {
    check(`
      a="#{
      b # foo!
      }"
    `, `
      const a=\`\${
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
      \`\\
      \\\${a}
      \\\${b}\\
      \`;
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

  it('handles parentheses before interpolations (#212)', () => {
    check(`
      "(#{a}"
    `, `
      \`(\${a}\`;
    `);
  });

  it('handles if expressions inside interpolations', () => {
    check('"#{if a then b else c}"', '`${a ? b : c}`;');
  });

  it('handles interpolations in indented herestrings', () => {
    check(`
      """
        a
        #{b}
        """
    `, `
      \`\\
      a
      \${b}\\
      \`;
    `);
  });

  it('does not strip leading whitespace in an edge case in interpolated strings (#556)', () => {
    check(`
      """    a
      b#{c}
      """
    `, `
      \`    a
      b\${c}\\
      \`;
    `);
  });

  it('removes newlines from multiline double-quoted strings (#554)', () => {
    check(`
      "
      a
      #{b}
      c
      "
    `, `
      \`\\
      a \\
      \${b} \\
      c\\
      \`;
    `);
  });

  it('handles empty string interpolations', () => {
    check(`
      "a#{}b"
    `, `
      \`ab\`;
    `);
  });

  it('handles empty heregex interpolations', () => {
    check(`
      ///a#{}b///
    `, `
      new RegExp(\`ab\`);
    `);
  });

  it('handles lone empty string interpolations', () => {
    check(`
      "#{}"
    `, `
      \`\`;
    `);
  });

  it('handles tagged template literals', () => {
    check(`
      a"b#{c}d"
    `, `
      a\`b\${c}d\`;
    `);
  });

  it('emits a tagged template literal even if there are no interpolations', () => {
    check(`
      a"b"
    `, `
      a\`b\`;
    `);
  });
});
