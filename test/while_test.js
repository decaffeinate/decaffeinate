import check from './support/check';

describe('while', () => {
  it('surrounds its condition with parentheses', () => {
    check(`
      while a
        b
    `, `
      while (a) {
        b;
      }
    `);
  });

  it('adds braces indented correctly', () => {
    check(`
      if a
        while b
          c
    `, `
      if (a) {
        while (b) {
          c;
        }
      }
    `);
  });

  it('adds braces for single-line while loops correctly', () => {
    check(`
      b while a
    `, `
      while (a) { b; }
    `);
  });

  it('does not add parentheses around the condition if they are already there', () => {
    check(`
      while (a)
        b
    `, `
      while (a) {
        b;
      }
    `);
  });

  it('turns an `until` loop into a `while` loop with a negated condition', () => {
    check(`
      until a
        b
    `, `
      while (!a) {
        b;
      }
    `);
  });

  it('wraps the `until` condition in parentheses if needed', () => {
    check(`
      until a < b
        a--
    `, `
      while (a >= b) {
        a--;
      }
    `);
  });

  it('turns `loop` into a `while` loop with an always-true condition', () => {
    check(`
      loop
        a
    `, `
      while (true) {
        a;
      }
    `);
  });

  it('turns `loop` with an inline body into an inline `while` loop with an always-true condition', () => {
    check(`
      loop a
    `, `
      while (true) { a; }
    `);
  });

  it('handles `while` loops used as an expression', () => {
    check(`
      a(b while c)
    `, `
      a((() => {
        let result = [];
        while (c) {
          result.push(b);
        }
        return result;
      })());
    `);
  });

  it('handles `while` loops with a guard used as an expression', () => {
    check(`
      a(b while c when d)
    `, `
      a((() => {
        let result = [];
        while (c) {
          if (d) {
            result.push(b);
          }
        }
        return result;
      })());
    `);
  });

  it('collects `undefined` when a code path has no value', () => {
    check(`
      a(
        while b
          if c
            d
          else if e
            f
      )
    `, `
      a((() => {
        let result = [];
        
        while (b) {
          let item;
          if (c) {
            item = d;
          } else if (e) {
            item = f;
          }
          result.push(item);
        }

        return result;
      })());
    `);
  });

  it('does not use a temporary variable when all code paths are covered', () => {
    check(`
      a(
        while b
          switch c
            when d
              e
            else
              f
      )
    `, `
      a((() => {
        let result = [];
        
        while (b) {
          switch (c) {
            case d:
              result.push(e);
              break;
            default:
              result.push(f);
          }
        }

        return result;
      })());
    `);
  });

  it('does not consider a `while` loop as an implicit return if it returns itself', () => {
    check(`
      ->
        while true
          return a
    `, `
      (function() {
        while (true) {
          return a;
        }
      });
    `);
  });

  it('considers a `while` loop as an implicit return if it only returns within a function', () => {
    check(`
      ->
        while true
          -> return a
    `, `
      () =>
        (() => {
          let result = [];
          while (true) {
            result.push(() => a);
          }
          return result;
        })()
      ;
    `);
  });

  it('handles a `while` loop with a `then` body', () => {
    check(`
      while a then ((a) -> a)(1)
    `, `
      while (a) { (a => a)(1); }
    `);
  });

  it('handles a `loop` with a `then` body', () => {
    check(`
      loop then a
    `, `
      while (true) { a; }
    `);
  });

  it('handles `while` with a `when` guard clause', () => {
    check(`
      while a b when c d
        e f
        g h
    `, `
      while (a(b)) {
        if (c(d)) {
          e(f);
          g(h);
        }
      }
    `);
  });

  it('does not add parentheses around `when` guard clause if it already has them', () => {
    check(`
      while a when (b)
        c
    `, `
      while (a) {
        if (b) {
          c;
        }
      }
    `);
  });

  it('handles a deeply-indented loop body in an expression context', () => {
    check(`
      longName(while a when b
                  if c
                    d
                  else if e
                    f)
    `, `
      longName((() => {
        let result = [];
        while (a) {
          if (b) {
            let item;
            if (c) {
              item = d;
            } else if (e) {
              item = f;
            }
            result.push(item);
          }
        }
        return result;
      })());
    `);
  });

  it('causes the condition not to add parentheses even if it normally would', () => {
    check(`
      a = b
      while a?
        c
    `, `
      let a = b;
      while (a != null) {
        c;
      }
    `);
  });

  it('supports yields in bodies', () => {
    check(`
      -> while false
        yield a while true
    `, `
      (function*() { return yield* (function*() {
        let result = [];
        while (false) {
          result.push(yield* (function*() {
            let result1 = [];
            while (true) {
              result1.push(yield a);
            }
            return result1;
          }).call(this));
        }
        return result;
      }).call(this); });
    `);
  });

  it('supports yields in bodies referencing `arguments`', () => {
    check(`
      ->
        while false
          yield arguments.length while true
    `, `
      (function*() {
        return yield* (function*() {
          let result = [];
          while (false) {
            result.push(yield* (function*() {
              let result1 = [];
              while (true) {
                result1.push(yield arguments.length);
              }
              return result1;
            }).apply(this, arguments));
          }
          return result;
        }).apply(this, arguments);
      });
    `);
  });

  it('supports yields in bodies referencing `arguments` in a nested function', () => {
    check(`
      ->
        while false
          yield (-> arguments.length) while true
    `, `
      (function*() {
        return yield* (function*() {
          let result = [];
          while (false) {
            result.push(yield* (function*() {
              let result1 = [];
              while (true) {
                result1.push(yield (function() { return arguments.length; }));
              }
              return result1;
            }).call(this));
          }
          return result;
        }).call(this);
      });
    `);
  });

  it('handles a condition containing "then" within a post-while', () => {
    check(`
      2 while if 1 then 0
    `, `
      while (1 ? 0 : undefined) { 2; }
    `);
  });

  it('does not add additional parens around a condition containing "then"', () => {
    check(`
      2 while (if 1 then 0)
    `, `
      while (1 ? 0 : undefined) { 2; }
    `);
  });

  it('handles a guard containing "then" within a post-while', () => {
    check(`
      a while b when if c then d
    `, `
      while (b) { if (c ? d : undefined) { a; } }
    `);
  });
});
