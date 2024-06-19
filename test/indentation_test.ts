import check from './support/check';

describe('indentation', () => {
  it('parses 2-space programs', () => {
    check(`if a\n  b`, `if (a) {\n  b;\n}`);
  });

  it('parses 4-space programs', () => {
    check(`if a\n    b`, `if (a) {\n    b;\n}`);
  });

  it('parses tabbed programs', () => {
    check(`if a\n\tb`, `if (a) {\n\tb;\n}`);
  });

  it('matches indentation when adding closing brace lines', () => {
    check(`if a\n\tif b\n\t\tc`, `if (a) {\n\tif (b) {\n\t\tc;\n\t}\n}`);
  });

  it('matches indentation when adding standalone lines', () => {
    check(
      `if a\n\tswitch b\n\t\twhen c\n\t\t\td`,
      `if (a) {\n\tswitch (b) {\n\t\tcase c:\n\t\t\td;\n\t\t\tbreak;\n\t}\n}`,
    );
  });

  it('handles valid inconsistent indentation', () => {
    check(
      `
      a ->
        return
       b
    `,
      `
      a(function() {
      });
      b;
    `,
    );
  });

  it('handles deeply nested inconsistent indentation', () => {
    check(
      `
      ->
        a
          .b =>
            return
          return 3
    `,
      `
      (function() {
        a
          .b(() => {
        });
        return 3;
      });
    `,
    );
  });

  it('handles a file with mixed tabs and spaces', () => {
    check(
      `
      while a
        b
      
      while c
      \tif d
      \t\te
    `,
      `
      while (a) {
        b;
      }
      
      while (c) {
      \tif (d) {
      \t\te;
      \t}
      }
    `,
    );
  });
});
