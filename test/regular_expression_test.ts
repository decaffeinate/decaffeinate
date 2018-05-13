import check, { checkCS1, checkCS2 } from './support/check';
import validate from './support/validate';

describe('regular expressions', () => {
  it('passes regular expressions through as-is', () => {
    check(`a = /foo\\s/`, `const a = /foo\\s/;`);
  });

  it('passes regular expressions with hash through as-is in an assignment context', () => {
    check(`a = /foo#\\s/`, `const a = /foo#\\s/;`);
  });

  it('passes regular expressions with hash through as-is in a function call context', () => {
    check(`a.a(/#/)`, `a.a(/#/);`);
  });

  it('rewrites block regular expressions as a RegExp call with a multiline string', () => {
    check(
      `
      a = ///
        foo .*
        bar
      ///
    `,
      `
      const a = new RegExp(\`\\
      foo.*\\
      bar\\
      \`);
    `
    );
  });

  it('preserves slash escapes in regular expressions', () => {
    check(`a = /foo\\/bar/`, `const a = /foo\\/bar/;`);
  });

  it('preserves regular expression flags', () => {
    check(`a = /a/ig`, `const a = /a/ig;`);
  });

  it('handles back-to-back escapes correctly', () => {
    check(`/\\/\\//`, `/\\/\\//;`);
  });

  it('escapes necessary characters in heregexes', () => {
    check(`///a/b\`c\${d\\e///`, `new RegExp(\`a/b\\\`c\\\${d\\\\e\`);`);
  });

  it('properly handles flags in heregexes', () => {
    check(`///a\nb///gi`, `new RegExp(\`a\\\nb\`, 'gi');`);
  });

  it('handles interpolations within comments in heregexes in CS1', () => {
    checkCS1(
      `
      ///
        foo  # hello #{abc}d
        #{bar}
      ///g
    `,
      `
      new RegExp(\`\\
      foo\${abc}d\\
      \${bar}\\
      \`, 'g');
    `
    );
  });

  it('handles interpolations within comments in heregexes in CS2', () => {
    checkCS2(
      `
      ///
        foo  # hello #{abc}d
        #{bar}
      ///g
    `,
      `
      new RegExp(\`\\
      foo\\
      \${bar}\\
      \`, 'g');
    `
    );
  });

  it('allows escaping spaces in heregexes', () => {
    check(`///a\\ b\\\tc\\\nd///`, `new RegExp(\`a b\tc\nd\`);`);
  });

  it('escapes \\u2028 within regexes', () => {
    check(
      `
      /\u2028/
      `,
      `
      /\\u2028/;
    `
    );
  });

  it('escapes \\u2029 within regexes', () => {
    check(
      `
      /\u2029/
      `,
      `
      /\\u2029/;
    `
    );
  });

  it('uses the existing escape character for escaped \\u2028 within regexes', () => {
    check(
      `
      /\\\u2028/
      `,
      `
      /\\u2028/;
    `
    );
  });

  it('leaves an escaped backslash when an escaped backslash is followed by \\u2028 within regexes', () => {
    check(
      `
      /\\\\\u2028/
      `,
      `
      /\\\\\\u2028/;
    `
    );
  });

  it('removes \\u2028 within heregexes', () => {
    check(
      `
      ///\u2028///
      `,
      `
      new RegExp(\`\`);
    `
    );
  });

  it('removes \\u2029 within heregexes', () => {
    check(
      `
      ///\u2029///
      `,
      `
      new RegExp(\`\`);
    `
    );
  });

  it('handles escaped \\u2028 within heregexes', () => {
    check(
      `
      ///\\\u2028///
      `,
      `
      new RegExp(\`\\u2028\`);
    `
    );
  });

  it('handles escaped \\u2029 within heregexes', () => {
    check(
      `
      ///\\\u2029///
      `,
      `
      new RegExp(\`\\u2029\`);
    `
    );
  });

  it('handles \\0 within heregexes', () => {
    check(
      `
      ///\\0///
      `,
      `
      new RegExp(\`\\\\x00\`);
    `
    );
  });

  it('behaves correctly with \\0 within heregexes', () => {
    validate(
      `
      setResult(///\\0 1///.test('\\0' + '1'))
      `,
      true
    );
  });

  it('handles a double backslash followed by a space', () => {
    check(
      `
      ///\\\\[\\\\ ]///
      `,
      `
      new RegExp(\`\\\\\\\\[\\\\\\\\]\`);
    `
    );
  });

  it('replaces unicode code point escapes with regular unicode escapes in regexes', () => {
    check(
      `
      /\\u{a}/
      `,
      `
      /\\u000a/;
    `
    );
  });

  it('replaces non-BMP unicode code point escapes with regular unicode escapes in regexes', () => {
    check(
      `
      /\\u{10000}/
      `,
      `
      /\\ud800\\udc00/;
    `
    );
  });

  it('replaces heregex unicode code point escapes with regular unicode escapes', () => {
    check(
      `
      ///\\u{a}///
      `,
      `
      new RegExp(\`\\\\u000a\`);
    `
    );
  });

  it('replaces heregex non-BMP unicode code point escapes with regular unicode escapes', () => {
    check(
      `
      ///\\u{10000}///
      `,
      `
      new RegExp(\`\\\\ud800\\\\udc00\`);
    `
    );
  });

  it('does not downgrade unicode code point escapes when the "u" flag is specified', () => {
    check(
      `
      /\\u{a}/u
      `,
      `
      /\\u{a}/u;
    `
    );
  });

  it('does not downgrade heregex unicode code point escapes when the "u" flag is specified', () => {
    check(
      `
      ///\\u{a}///u
      `,
      `
      new RegExp(\`\\\\u{a}\`, 'u');
    `
    );
  });

  it('does not replace unicode when u is preceded by two backslashes', () => {
    check(
      `
      /\\\\u{a}/
      `,
      `
      /\\\\u{a}/;
    `
    );
  });
});
