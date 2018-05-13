import check from './support/check';

describe('literate mode', () => {
  it('handles a simple case', () => {
    check(
      `
      This is a *thing*.
      It doesn't do much.
      
          thing = 1
      
      This is another thing. It's a little more interesting.
      
          otherThing = for foo in stuff
            if foo % 2 == 0
              foo + 1
    `,
      `
      // This is a *thing*.
      // It doesn't do much.
      const thing = 1;
      
      // This is another thing. It's a little more interesting.
      const otherThing = (() => {
        const result = [];
        for (let foo of Array.from(stuff)) {
          if ((foo % 2) === 0) {
            result.push(foo + 1);
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    `,
      {
        options: {
          literate: true
        }
      }
    );
  });

  it('handles a file starting with code and ending with a comment', () => {
    check(
      `
          a = 1
          b = 2
          c = 3
      Those are the first three letters of the alphabet.
    `,
      `
      const a = 1;
      const b = 2;
      const c = 3;
      // Those are the first three letters of the alphabet.
    `,
      {
        options: {
          literate: true
        }
      }
    );
  });

  it('requires a blank line before moving to a code section', () => {
    check(
      `
      I can
        indent
          all that I want
            and it still will be in a comment.
      
          exceptNow = true
    `,
      `
      // I can
      //   indent
      //     all that I want
      //       and it still will be in a comment.
      const exceptNow = true;
    `,
      {
        options: {
          literate: true
        }
      }
    );
  });

  it('handles increasing indentation across distinct code sections', () => {
    check(
      `
      This is a
      multiline comment.
      
          if a
      
      This is another
      multiline comment.      

            if b
      
      This is yet another
      multiline comment.      
      
              c
    `,
      `
      // This is a
      // multiline comment.
      if (a) {
      
      // This is another
      // multiline comment.      
        if (b) {
      
      // This is yet another
      // multiline comment.      
          c;
        }
      }
    `,
      {
        options: {
          literate: true
        }
      }
    );
  });

  it('treats normal coffee files as non-literate', () => {
    check(
      `
      a = 1
    `,
      `
      const a = 1;
    `,
      {
        options: {
          filename: 'foo.coffee'
        }
      }
    );
  });

  it('treats .coffee.md files as literate', () => {
    check(
      `
      a = 1
    `,
      `
      // a = 1
    `,
      {
        options: {
          filename: 'foo.coffee.md'
        }
      }
    );
  });

  it('treats .litcoffee files as literate', () => {
    check(
      `
      a = 1
    `,
      `
      // a = 1
    `,
      {
        options: {
          filename: 'foo.litcoffee'
        }
      }
    );
  });
});
