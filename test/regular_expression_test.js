import check from './support/check';

describe('regular expressions', () => {
  it('passes regular expressions through as-is', function() {
    check(`a = /foo\s/`, `var a = /foo\s/;`);
  });

  it('passes regular expressions with hash through as-is in an assignment context', function() {
    check(`a = /foo#\s/`, `var a = /foo#\s/;`);
  });

  it('passes regular expressions with hash through as-is in a function call context', function() {
    check(`a.a(/#/)`, `a.a(/#/);`);
  });

  it('rewrites block regular expressions as normal regular expressions', function() {
    check(`
        a = ///
          foo .*
          bar
        ///
      `, `
        var a = /foo.*bar/;
      `);
  });

  it('preserves slash escapes in regular expressions', function() {
    check(`a = /foo\\/bar/`, `var a = /foo\\/bar/;`);
  });

  it('preserves regular expression flags', function() {
    check(`a = /a/ig`, `var a = /a/ig;`);
  });

  it('handles back-to-back escapes correctly', () => {
    check(`/\\/\\//`, `/\\/\\//;`);
  });

  it('escapes slashes in heregexes', () => {
    check(`///a/b///`, `/a\\/b/;`);
  });
});
