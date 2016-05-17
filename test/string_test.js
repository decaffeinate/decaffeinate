import check from './support/check.js';
import validate from './support/validate.js';

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
    check(`'''\na'''`, `'a';`);
  });

  it('escapes backticks when changing the quote type', () => {
    check("'''a\n`'''", '`a\n\\\``;');
  });

  it('strips shared leading spaces for each line of multi-line triple-quoted strings', () => {
    check('"""\n  a\n  b\n   c\n"""', '`a\nb\n c`;');
  });

  it('ignores empty lines for indent-stripping purposes', () => {
    check('"""\n  a\n\n   c\n"""', '`a\n\n c`;');
  });

  it('works with multi-line strings containing all empty lines by stripping the first and last', () => {
    check('"""\n\n\n\n"""', '`\n\n`;');
  });

  it('works when the triple-quoted string is indented', () => {
    check(`
      a = """
           foo
           bar
          """
    `, `
      let a = \`foo
      bar\`;
    `);
  });

  it('appends semicolons after the parentheses of a function call with a triple-double-quoted multi-line string as argument', () => {
    check(`
      a("""line1
      line2""")
    `, `
      a(\`line1
      line2\`);
    `);
  });

  it('appends semicolons after the parentheses of a function call with a triple-single-quoted multi-line string as argument', () => {
    check(`
      a('''line1
      line2''')
    `, `
      a(\`line1
      line2\`);
    `);
  });

  xit('joins multi line doubled quoted strings on new lines and removes indentation', () => {
    check(`
     a = "multi line
          double\\nquote
          string"
     `, `
     let a = "multi line double\\nquote string";
     `);
  });

  xit('joins multi line single quoted strings on new lines and removes indentation', () => {
    check(`
     a = 'multi line
          double\\nquote
          string'
     `, `
     let a = 'multi line double\\nquote string';
     `);
  });

  xit('joins multi line triple double quoted strings on new lines, removes indentation and adds new line characters', () => {
    check(`
     a = """multi line
          double\\nquote
          string"""
     `, `
     let a = \`multi line\\ndouble\\nquote\\nstring\`;
     `);
  });

  xit('joins multi line triple single quoted strings on new lines, removes indentation and adds new line characters', () => {
    check(`
     a = '''multi line
          double\\nquote
          string'''
     `, `
     let a = \`multi line\\ndouble\\nquote\\nstring\`;
     `);
  });
});

describe('string integration test', () => {
  let quoteTypes = [['\'', 'single quote'],
                    ['"', 'double quote'],
                    ['\'\'\'', 'triple single quote'],
                    ['"""', 'triple double quote']];
  let newLineTypes = [['', 'without new lines'],
                      ['\n            ', 'with new lines']];
  let interpolations = [['', 'without interpolation'],
                        ['#{testVariable}', 'with string variable interpolation'],
                        ['#{ 22 / 7}', 'with numerical interpolation']];

  for (let quote of quoteTypes) {
    for (let newLine of newLineTypes) {
      for (let interp of interpolations) {
        let [quoteType, quoteTypeFriendly] = quote;
        let [newLineType, newLineTypeFriendly] = newLine;
        let [interpolation, interpolationFriendly] = interp;
        it(quoteTypeFriendly + ' ' + newLineTypeFriendly + ' and ' + interpolationFriendly, () => {
          validate(
`() ->
  testVariable = "only testing!"
  return ${quoteType}a line of text${newLineType}perhaps some${interpolation}${newLineType}and then${quoteType}
`);
        });
      }
    }
  }
});
