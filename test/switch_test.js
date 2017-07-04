import check from './support/check';
import validate from './support/validate';

describe('switch', () => {
  it('works with a single case', () => {
    check(`
      switch a
        when b
          c
    `, `
      switch (a) {
        case b:
          c;
          break;
      }
    `);
  });

  it('works when there is a comment after the expression', () => {
    check(`
      switch a # yolo
        when b
          c
    `, `
      switch (a) { // yolo
        case b:
          c;
          break;
      }
    `);
  });


  it('works when the expression is already surrounded by parens', () => {
    check(`
      switch (a?)
        when b
          c
    `, `
      switch (typeof a !== 'undefined' && a !== null) {
        case b:
          c;
          break;
      }
    `);
  });

  it('only inserts break statements when needed', () => {
    check(`
      switch a
        when b
          c
          break
        when d
          e
          break
    `, `
      switch (a) {
        case b:
          c;
          break;
        case d:
          e;
          break;
      }
    `);
  });

  it('works with multiple cases', () => {
    check(`
      switch a
        when b
          c
        when d
          e
    `, `
      switch (a) {
        case b:
          c;
          break;
        case d:
          e;
          break;
      }
    `);
  });

  it('works with multiple conditions per case', () => {
    check(`
      switch a
        when b, c
          d
    `, `
      switch (a) {
        case b: case c:
          d;
          break;
      }
    `);
  });

  it('works with cases and consequents on the same line', () => {
    check(`
      switch a
        when b then c
    `, `
      switch (a) {
        case b: c; break;
      }
    `);
  });

  it('works with a default case', () => {
    check(`
      switch a
        when b
          c
        else
          d
    `, `
      switch (a) {
        case b:
          c;
          break;
        default:
          d;
      }
    `);
  });

  it('works with a single-line default case', () => {
    check(`
      switch a
        when b then c
        else d
    `, `
      switch (a) {
        case b: c; break;
        default: d;
      }
    `);
  });

  it('works with an indented switch', () => {
    check(`
      if true
        switch a
          when b
            c
    `, `
      if (true) {
        switch (a) {
          case b:
            c;
            break;
        }
      }
    `);
  });

  it('works with implicit returns', () => {
    check(`
      ->
        switch a
          when b then c
          when d
            e
            f
          else g
    `, `
      (function() {
        switch (a) {
          case b: return c;
          case d:
            e;
            return f;
          default: return g;
        }
      });
    `);
  });

  it('works with implicit returns with the default case on another line', () => {
    check(`
      ->
        switch a
          when b then c
          else
            d
    `, `
      (function() {
        switch (a) {
          case b: return c;
          default:
            return d;
        }
      });
    `);
  });

  it('writes the closing curly brace inside a function closing brace', () => {
    check(`
      a = ->
        switch b
          when c
            d
      e
    `, `
      const a = function() {
        switch (b) {
          case c:
            return d;
        }
      };
      e;
    `);
  });

  it('converts a switch without an expression properly', () => {
    check(`
      switch
        when score < 60 then 'F'
        when score < 70 then 'D'
        when score < 80 then 'C'
        when score < 90 then 'B'
        else 'A'
    `, `
      switch (false) {
        case score >= 60: 'F'; break;
        case score >= 70: 'D'; break;
        case score >= 80: 'C'; break;
        case score >= 90: 'B'; break;
        default: 'A';
      }
    `, {
      options: {
        looseComparisonNegation: true,
      }
    });
  });

  it('converts a switch without an expression with function call cases', () => {
    check(`
      switch
        when a()
          'B'
        when c()
          'D'
    `, `
      switch (false) {
        case !a():
          'B';
          break;
        case !c():
          'D';
          break;
      }
    `);
  });

  it('works with `switch` used as an expression', () => {
    check(`
      a = switch b
        when c then d
        when f
          return g
        else e
    `, `
      const a = (() => { switch (b) {
        case c: return d;
        case f:
          return g;
        default: return e;
      } })();
    `);
  });

  it('works with `switch` used as an expression surrounded by parens', () => {
    check(`
      a(switch b
        when c then d)
    `, `
      a((() => { switch (b) {
        case c: return d;
      } })());
    `);
  });

  it('works with the switch from the CoffeeScript demo page', () => {
    check(`
    switch day
      when "Mon" then go work
      when "Tue" then go relax
      when "Thu" then go iceFishing
      when "Fri", "Sat"
        if day is bingoDay
          go bingo
          go dancing
      when "Sun" then go church
      else go work
    `, `
      switch (day) {
        case "Mon": go(work); break;
        case "Tue": go(relax); break;
        case "Thu": go(iceFishing); break;
        case "Fri": case "Sat":
          if (day === bingoDay) {
            go(bingo);
            go(dancing);
          }
          break;
        case "Sun": go(church); break;
        default: go(work);
      }
    `);
  });

  it('works with switch expressions returning an object literal', () => {
    check(`
      a b, switch c
        when d
          {}
    `, `
      a(b, (() => { switch (c) {
        case d:
          return {};
      } })());
    `);
  });

  it('works with empty switch cases', () => {
    check(`
    switch a
      when b then
        # Do nothing
      when c then
        # Do nothing
    `, `
      switch (a) {
        case b:
          break;
          // Do nothing
        case c:
          break;
      }
          // Do nothing
    `);
  });

  it('handles a switch as an argument to a function call', () => {
    check(`
      a switch b
        when c
          d
        when e
          f
    `, `
      a((() => { switch (b) {
        case c:
          return d;
        case e:
          return f;
      
      } })());
    `);
  });

  it('inserts break statements properly in cases containing returns', () => {
    check(`
      ->
        switch a
          when b
            if c
              return d
          when e
            if f
              return g
    `, `
      (function() {
        switch (a) {
          case b:
            if (c) {
              return d;
            }
            break;
          case e:
            if (f) {
              return g;
            }
            break;
        }
      });
    `);
  });

  it('handles switch expressions within simple for expressions', () => {
    check(`
      x = for a in b
        switch a
          when 'c'
            d
          else
            e
    `, `
      const x = (() => {
        const result = [];
        for (let a of Array.from(b)) {
          switch (a) {
            case 'c':
              result.push(d);
              break;
            default:
              result.push(e);
          }
        }
        return result;
      })();
    `);
  });

  it('handles switch expressions within complex for expressions', () => {
    check(`
      x = for a in b by 1
        y = switch a
          when 'c'
            d
          else
            e
        y
    `, `
      const x = (() => {
        const result = [];
        for (let i = 0; i < b.length; i++) {
          var a = b[i];
          const y = (() => { switch (a) {
            case 'c':
              return d;
            default:
              return e;
          } })();
          result.push(y);
        }
        return result;
      })();
    `);
  });

  it('handles a switch case with a while loop with a break', () => {
    check(`
      switch a
        when 'b'
          while false
            break
        when 'c'
          console.log 'Got here'
    `, `
      switch (a) {
        case 'b':
          while (false) {
            break;
          }
          break;
        case 'c':
          console.log('Got here');
          break;
      }
    `);
  });

  it('sets the switch condition to be an expression', () => {
    check(`
      a = 1
      switch (a ?= b)
        when c
          d
    `, `
      let a = 1;
      switch (a != null ? a : (a = b)) {
        case c:
          d;
          break;
      }
    `);
  });

  it('allows an IIFE-style switch inside a generator', () => {
    check(`
      ->
        x = switch yield 1
          when 2
            3
    `, `
      (function*() {
        let x;
        return x = yield* (function*() { switch ((yield 1)) {
          case 2:
            return 3;
        } }).call(this);
      });
    `);
  });

  it('properly handles an expression-style switch in an implicit return context', () => {
    check(`
      ->
        x = (switch a
           when b
             c)
    `, `
      (function() {
        let x;
        return x = ((() => { switch (a) {
           case b:
             return c;
        } })());
      });
    `);
  });

  it('handles parenthesized break in a switch statement', () => {
    check(`
      x = switch a
        when b
          (break)
    `, `
      const x = (() => { switch (a) {
        case b:
          break;
      } })();
    `);
  });

  it('handles break within switch in an implicit return context', () => {
    check(`
      ->
        switch a
          when b
            break
    `, `
      (function() {
        switch (a) {
          case b:
            break;
        }
      });
    `);
  });

  it('handles a parenthesized switch case', () => {
    check(`
      switch a
        when (b)
          c
    `, `
      switch (a) {
        case (b):
          c;
          break;
      }
    `);
  });

  it('allows falling through in a returned switch', () => {
    check(`
      ->
        return switch a
          when b
            c
        d
    `, `
      (function() {
        switch (a) {
          case b:
            return c;
        }
        return d;
      });
    `);
  });

  it('gives the correct result when returning an incomplete switch', () => {
    validate(`
      f = ->
        return switch 1
          when 2
            3
        4
      setResult(f())
    `, 4);
  });

  it('gives the correct result when returning a parenthesized incomplete switch', () => {
    validate(`
      f = ->
        return (switch 1
          when 2
            3)
        4
      setResult('' + f())
    `, 'undefined');
  });
});
