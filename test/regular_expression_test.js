import check from './support/check.js';

describe('regular expressions', () => {
  it('passes regular expressions through as-is', () => {
    check(`a = /foo\s/`, `let a = /foo\s/;`);
  });

  it('passes regular expressions with hash through as-is in an assignment context', () => {
    check(`a = /foo#\s/`, `let a = /foo#\s/;`);
  });

  it('passes regular expressions with hash through as-is in a function call context', () => {
    check(`a.a(/#/)`, `a.a(/#/);`);
  });

  it('rewrites block regular expressions as normal regular expressions', () => {
    check(`
      a = ///
        foo .*
        bar
      ///
    `, `
      let a = /foo.*bar/;
    `);
  });

  it('preserves slash escapes in regular expressions', () => {
    check(`a = /foo\\/bar/`, `let a = /foo\\/bar/;`);
  });

  it('preserves regular expression flags', () => {
    check(`a = /a/ig`, `let a = /a/ig;`);
  });

  it('handles back-to-back escapes correctly', () => {
    check(`/\\/\\//`, `/\\/\\//;`);
  });

  it('escapes slashes in heregexes', () => {
    check(`///a/b///`, `/a\\/b/;`);
  });
});
