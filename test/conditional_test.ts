import check from './support/check';
import validate from './support/validate';

describe('conditionals', () => {
  it('surrounds `if` conditions in parentheses and bodies in curly braces', () => {
    check(
      `
      if a
        b
    `,
      `
      if (a) {
        b;
      }
    `,
    );
  });

  it('surrounds `unless` conditions in parentheses and precedes it with a `!` operator', () => {
    check(
      `
      unless a
        b
    `,
      `
      if (!a) {
        b;
      }
    `,
    );
  });

  it('surrounds `unless` conditions in additional parentheses if needed for the `!` operator', () => {
    check(
      `
      unless a == b
        c
    `,
      `
      if (a !== b) {
        c;
      }
    `,
    );
  });

  it('does not add parentheses if the condition is already surrounded by them', () => {
    check(
      `
      if (a)
        b
    `,
      `
      if (a) {
        b;
      }
    `,
    );
    check(
      `
      unless (a)
        b
    `,
      `
      if (!a) {
        b;
      }
    `,
    );
  });

  it('causes the condition not to add parentheses even if it normally would', () => {
    check(
      `
      a = b
      if a?
        c
    `,
      `
      const a = b;
      if (a != null) {
        c;
      }
    `,
    );
  });

  it('correctly inserts parentheses when an `unless` condition requires them when it was surrounded by parentheses', () => {
    check(
      `
      unless (a == b)
        c
    `,
      `
      if (a !== b) {
        c;
      }
    `,
    );
  });

  it('adds parentheses when `unless` is used with an assignment', () => {
    check(
      `
      unless a = b
        c
    `,
      `
      let a;
      if (!(a = b)) {
        c;
      }
    `,
    );
  });

  it('keeps parentheses when `unless` is used with an assignment', () => {
    check(
      `
      unless (a = b)
        c
    `,
      `
      let a;
      if (!(a = b)) {
        c;
      }
    `,
    );
  });

  it('adds parentheses when `unless` is used with a normal binary operator', () => {
    check(
      `
      unless a + b
        c
    `,
      `
      if (!(a + b)) {
        c;
      }
    `,
    );
  });

  it('keeps parentheses when `unless` is used with a normal binary operator', () => {
    check(
      `
      unless (a + b)
        c
    `,
      `
      if (!(a + b)) {
        c;
      }
    `,
    );
  });

  it('handles indented `if` statements correctly', () => {
    check(
      `
      if a
        if b
          c
    `,
      `
      if (a) {
        if (b) {
          c;
        }
      }
    `,
    );
  });

  it('surrounds the `else` clause of an `if` statement in curly braces', () => {
    check(
      `
      if a
        b
      else
        c
    `,
      `
      if (a) {
        b;
      } else {
        c;
      }
    `,
    );
  });

  it('surrounds the `else if` condition in parentheses', () => {
    check(
      `
      if a
        b
      else if c
        d
    `,
      `
      if (a) {
        b;
      } else if (c) {
        d;
      }
    `,
    );
  });

  it('works with several `else if` clauses and an `else`', () => {
    check(
      `
      if a
        b
      else if c
        d
      else if e
        f
      else
        g
    `,
      `
      if (a) {
        b;
      } else if (c) {
        d;
      } else if (e) {
        f;
      } else {
        g;
      }
    `,
    );
  });

  it('works with `if` with immediate return', () => {
    check(
      `
      ->
        if a
          b
      c
    `,
      `
      (function() {
        if (a) {
          return b;
        }
      });
      c;
    `,
    );
  });

  it('keeps single-line `if` statements on one line', () => {
    check(`if a then b`, `if (a) { b; }`);
  });

  it('keeps single-line `if` with `else` on one line', () => {
    check(`if a then b else c`, `if (a) { b; } else { c; }`);
  });

  it('handles `if` statements with an implicit call in the condition', () => {
    check(`if a b then c`, `if (a(b)) { c; }`);
  });

  it('turns simple `if` with `else` as an expression into a ternary operator', () => {
    check(`a(if b then c else d)`, `a(b ? c : d);`);
  });

  it('turns simple `if` without `else` as an expression into a ternary operator with undefined', () => {
    check(`a(if b then c)`, `a(b ? c : undefined);`);
  });

  it('adds ternary operator code after any insertions for the consequent', () => {
    check(`a(if b then c: d)`, `a(b ? {c: d} : undefined);`);
  });

  it('turns multi-line `if` into an IIFE with statements', () => {
    check(
      `
      ->
        z(if a
          c = a
          a + c
        else
          d = a
          a - d)
    `,
      `
      (() => z((() => {
        if (a) {
        const c = a;
        return a + c;
      } else {
        const d = a;
        return a - d;
      }
      })()));
    `,
    );
  });

  it('keeps single-line POST-`if`', () => {
    check(`a if b`, `if (b) { a; }`);
    check(
      `
      ->
        return if a is b
        null
      `,
      `
        (function() {
          if (a === b) { return; }
          return null;
        });
    `,
    );
  });

  it('keeps single-line POST-`if` with implicit call as the condition', () => {
    check(
      `
      a if b c
    `,
      `
      if (b(c)) { a; }
    `,
    );
  });

  it('keeps single-line POST-`unless`', () => {
    check(`a unless b`, `if (!b) { a; }`);
  });

  it('allowed parenthesized member expressions in `unless`', () => {
    check(`unless (a.b) then c`, `if (!a.b) { c; }`);
  });

  it('pushes returns into `if` statements', () => {
    check(
      `
      ->
        if a
          b
    `,
      `
      (function() {
        if (a) {
          return b;
        }
      });
    `,
    );
  });

  it('pushes returns into `else if` blocks', () => {
    check(
      `
      ->
        if a
          b
        else if c
          d
    `,
      `
      (function() {
        if (a) {
          return b;
        } else if (c) {
          return d;
        }
      });
    `,
    );
  });

  it('works with if then throw inline', () => {
    check(`if a then throw err`, `if (a) { throw err; }`);
  });

  it('works with POST-`if` as the body of a function', () => {
    check(`-> a if b`, `(function() { if (b) { return a; } });`);
  });

  it('works with nested POST-`if`', () => {
    check(
      `
      a(b) if c(d) unless e(f)
    `,
      `
      if (!e(f)) { if (c(d)) { a(b); } }
    `,
    );
  });

  it('works with nested POST-`if` with implicit calls', () => {
    check(
      `
      a b if c d unless e f
    `,
      `
      if (!e(f)) { if (c(d)) { a(b); } }
    `,
    );
  });

  it('works with `unless` in an expression context', () => {
    check(
      `
      x = (a unless b)
    `,
      `
      const x = (!b ? a : undefined);
    `,
    );
  });

  it('works with `unless` in an object value (#566)', () => {
    check(
      `
      isValid = true

      testing = {
          test: "Hello world" unless isValid
      }
    `,
      `
      const isValid = true;

      const testing = {
          test: !isValid ? "Hello world" : undefined
      };
    `,
    );
  });

  it('surrounds the conditional expression in parens as part of a binary expression', () => {
    check(
      `
      a + if b then c else d
    `,
      `
      a + (b ? c : d);
    `,
    );
  });

  it('surrounds the conditional expression in parens as part of a unary expression', () => {
    check(
      `
      -if b then c else d
    `,
      `
      -(b ? c : d);
    `,
    );
  });

  it('does not add extra parens to a conditional expression', () => {
    check(
      `
      a + (if b then c else d)
    `,
      `
      a + (b ? c : d);
    `,
    );
  });

  it('does not add unnecessary parens to a conditional expression', () => {
    check(
      `
      a ** if b then c else d
    `,
      `
      Math.pow(a, b ? c : d);
    `,
    );
  });

  it('adds parenthesis if needed', () => {
    check(
      `
      alert if (a) and (b)
    `,
      `
      if ((a) && (b)) { alert; }
    `,
    );
  });

  it('does not remove parentheses around conditions in conditional expressions', () => {
    check(
      `
      r = if (f is 0.5) then a else b
    `,
      `
      const r = (f === 0.5) ? a : b;
    `,
    );
  });

  it('handles implicit function calls in the else clause', () =>
    check(
      `
      if a
        b
      else
        c d
    `,
      `
      if (a) {
        b;
      } else {
        c(d);
      }
    `,
    ));

  it('creates an IIFE when a complicated condition is used in an expression context', () =>
    check(
      `
      a = if b
          c
        else if d
          e
    `,
      `
      const a = (() => {
        if (b) {
          return c;
        } else if (d) {
          return e;
        }
      })();
    `,
    ));

  it('creates a properly-formatted IIFE for nested `if`s in a function body', () =>
    check(
      `
      a(if b
          if c
            null)
    `,
      `
      a((() => {
        if (b) {
          if (c) {
            return null;
          }
        }
      })());
    `,
    ));

  it('creates a properly-formatted IIFE with the `if` on the next line', () =>
    check(
      `
      c =
        if a
          x = 0
          x = x + 1 if b
          x
        else
          1
    `,
      `
      const c =
        (() => {
        if (a) {
          let x = 0;
          if (b) { x = x + 1; }
          return x;
        } else {
          return 1;
        }
      })();
    `,
    ));

  it('allows a missing consequent in an if-else', () =>
    check(
      `
      if a
        # Do nothing
      else
        b
    `,
      `
      if (a) {
        // Do nothing
      } else {
        b;
      }
    `,
    ));

  it('allows a missing consequent in an expression-style if-else', () =>
    check(
      `
      x =
        if a
          # Do nothing
        else
          b
    `,
      `
      const x =
        a ?
          // Do nothing
        undefined :
          b;
    `,
    ));

  it('allows a condition with an else token but not an alternate', () =>
    check(
      `
      if a
        b
      else
        # Do nothing
    `,
      `
      if (a) {
        b;
      }
      else {}
        // Do nothing
    `,
    ));

  it('allows an expression-style condition with an else token but not an alternate', () =>
    check(
      `
      x =
        if a
          b
        else
          # Do nothing
    `,
      `
      const x =
        a ?
          b
         : undefined;
          // Do nothing
    `,
    ));

  it('handles a conditional without a space before the `else` token', () =>
    check(
      `
      if a then (b)else c
    `,
      `
      if (a) { b;} else { c; }
    `,
    ));

  it('handles an IIFE conditional within an IIFE for loop', () =>
    check(
      `
      x = for a in b by 1
        y = 
          if a
            if b
              c
          else
            d
        y
    `,
      `
      const x = (() => {
        const result = [];
        for (let i = 0; i < b.length; i++) {
          var a = b[i];
          const y = 
            (() => {
            if (a) {
              if (b) {
                return c;
              }
            } else {
              return d;
            }
          })();
          result.push(y);
        }
        return result;
      })();
    `,
    ));

  it('handles a multiline condition in a postfix conditional', () => {
    check(
      `
      a if do ->
        b
    `,
      `
      if (((() => b))()) { a; }
    `,
    );
  });

  it('handles a conditional with no consequent or alternate', () => {
    check(
      `
      if a
      else
    `,
      `
      if (a) {} 
      else {}
    `,
    );
  });

  it('handles a conditional with only a comment for the consequent and alternate', () => {
    check(
      `
      ->
        if false
          # comment
        else if true
          ###
          block comment
          ###
        else
    `,
      `
      (function() {
        if (false) {
          // comment
        } else if (true) {} 
          /*
          block comment
          */
        else {}
      });
    `,
    );
  });

  it('handles a parenthesized empty condition with only a block comment for its body', () => {
    check(
      `
      x = (if true
        ### a ###
      else
      )
    `,
      `
      const x = (true ?
        /* a */
      undefined : undefined
      );
    `,
    );
  });

  it('handles an IIFE-style conditional containing a yield', () => {
    check(
      `
      ->
        x = if a
          if b
            c
          yield d
    `,
      `
      (function*() {
        let x;
        return x = yield* (function*() {
          if (a) {
          if (b) {
            c;
          }
          return yield d;
        }
        }).call(this);
      });
    `,
    );
  });

  it('handles a post-while as a function argument', () => {
    check(
      `
      a(b if c, d)
    `,
      `
      a((c ? b : undefined), d);
    `,
    );
  });

  it('handles a post-while as an array element', () => {
    check(
      `
      [a if b, c]
    `,
      `
      [(b ? a : undefined), c];
    `,
    );
  });

  it('handles a post-while as an object element', () => {
    check(
      `
      {a: b if c, d}
    `,
      `
      ({a: (c ? b : undefined), d});
    `,
    );
  });

  it('handles an assignment within an expression-style conditional', () => {
    validate(
      `
      a =
        if b = 1
          2
        else
          3
      setResult(b)
    `,
      1,
    );
  });

  it('properly handles an expression-style conditional in an implicit return context', () => {
    check(
      `
      ->
        x = (if a then b else c)
    `,
      `
      (function() {
        let x;
        return x = (a ? b : c);
      });
    `,
    );
  });

  it('handles a postfix loop within a postfix conditional', () => {
    check(
      `
      a for a in b if b
    `,
      `
      if (b) { for (let a of Array.from(b)) { a; } }
    `,
    );
  });

  it('handles negated parenthesized conditionals', () => {
    check(
      `
      a unless (b if c)
    `,
      `
      if (!(c ? b : undefined)) { a; }
    `,
    );
  });

  it('handles negated IIFE-style conditionals', () => {
    check(
      `
      a unless (
        if b
          if c
            d)
    `,
      `
      if (!(() => {
        
        if (b) {
          if (c) {
            return d;
          }
        }
      })()) { a; }
    `,
    );
  });

  it('handles a postfix conditional followed by a semicolon', () => {
    check(
      `
      a if b; c
    `,
      `
      if (b) { a; } c;
    `,
    );
  });

  it('handles a return within a returned conditional', () => {
    check(
      `
      ->
        return if a
          return b
    `,
      `
      (function() {
        if (a) {
          return b;
        }
      });
    `,
    );
  });

  it('handles a conditional with an inline empty body', () => {
    check(
      `
      if a then
    `,
      `
      if (a) {}  
    `,
    );
  });

  it('allows falling through an empty conditional in a return statement', () => {
    check(
      `
      ->
        return if a
          b
        c
    `,
      `
      (function() {
        if (a) {
          return b;
        }
        return c;
      });
    `,
    );
  });

  it('gives the correct result when returning an incomplete conditional', () => {
    validate(
      `
      f = ->
        return if 0
          1
        2
      setResult(f())
    `,
      2,
    );
  });

  it('gives the correct result when returning a parenthesized incomplete conditional', () => {
    validate(
      `
      f = ->
        return (if 0
          1)
        2
      setResult('' + f())
    `,
      'undefined',
    );
  });

  it('handles an expression-style conditional ending in a semicolon', () => {
    check(
      `
      x = if a
        ;
    `,
      `
      const x = a ? undefined : undefined;
    `,
    );
  });

  it('handles an expression-style conditional with semicolon consequent', () => {
    check(
      `
      x = if a
        ;
      else
        b
    `,
      `
      const x = a ?
        
      undefined :
        b;
    `,
    );
  });

  it('handles an IIFE conditional with an assigned variable used later', () => {
    check(
      `
      a =
        if b
          c = d
        else if e
          f
      c
    `,
      `
      let c;
      const a =
        (() => {
        if (b) {
          return c = d;
        } else if (e) {
          return f;
        }
      })();
      c;
    `,
    );
  });

  it('produces the right result with an IIFE conditional with assignment followed by access', () => {
    validate(
      `
      value = 3
      
      result =
        if value == 3
          x = 1
        else if value == 4
          2
      
      if value == 3
        setResult(x)
    `,
      1,
    );
  });

  it('handles multiline inline conditionals with an existential operator condition (#1230)', () => {
    check(
      `
      test  = if \\
        cond? \\
        then 'true' else 'no'
    `,
      `
      const test  = (typeof cond !== 'undefined' && cond !== null) 
        ? 'true' : 'no';
    `,
    );
  });
});
