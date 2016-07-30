import check from './support/check.js';
import validate from './support/validate.js';

describe('for loops', () => {
  it('transforms basic for-of loops into for-in', () => {
    check(`
      for k of o
        k
    `, `
      for (let k in o) {
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value into for-in', () => {
    check(`
      for k, v of o
        k
    `, `
      for (let k in o) {
        let v = o[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value plus unsafe-to-repeat target by saving a reference', () => {
    check(`
      for k, v of object()
        k
    `, `
      let iterable;
      for (let k in (iterable = object())) {
        let v = iterable[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with destructured value', () => {
    check(`
      for k, {x, y} of o
        k + x
    `, `
      for (let k in o) {
        let {x, y} = o[k];
        k + x;
      }
    `);
  });

  it('transforms for-of loops with destructured value plus unsafe-to-repeat target', () => {
    check(`
      for key, {x, y} of object()
        key + x
    `, `
      let iterable;
      for (let key in (iterable = object())) {
        let {x, y} = iterable[key];
        key + x;
      }
    `);
  });

  it('transforms for-in loops to typical `for` loops', () => {
    check(`
      for a in b
        a
    `, `
      for (let i = 0; i < b.length; i++) {
        let a = b[i];
        a;
      }
    `);
  });

  it('transforms for-in loops with an index to typical `for` loops', () => {
    check(`
      for a, j in b
        a
    `, `
      for (let j = 0; j < b.length; j++) {
        let a = b[j];
        a;
      }
    `);
  });

  it('transforms for-in loops with destructured value', () => {
    check(`
      for { a, b } in c
        a + b
    `, `
      for (let i = 0; i < c.length; i++) {
        let { a, b } = c[i];
        a + b;
      }
    `);
  });

  it.skip('transforms `for` loops without an index', () => {
    check(`
      for [0..1]
        2
    `, `
      for (let i = 0; i <= 1; i++) {
        2;
      }
    `);
  });

  it.skip('gives `for` loops without an index an index that does not collide with existing bindings', () => {
    check(`
      for [0..1]
        i
    `, `
      for (let j = 0; j <= 1; j++) {
        i;
      }
    `);
  });

  it('allows iterating with for-in by a specific step size', () => {
    check(`
      for a in b by 2
        a
    `, `
      for (let i = 0; i < b.length; i += 2) {
        let a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in in reverse', () => {
    check(`
      for a in b by -1
        a
    `, `
      for (let i = b.length - 1; i >= 0; i--) {
        let a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in in reverse with a specific step size', () => {
    check(`
      for a in b by -2
        a
    `, `
      for (let i = b.length - 1; i >= 0; i -= 2) {
        let a = b[i];
        a;
      }
    `);
  });

  it('allows filtering using a `when` clause', () => {
    check(`
      for a in b when a.c
        a
    `, `
      for (let i = 0; i < b.length; i++) {
        let a = b[i];
        if (a.c) {
          a;
        }
      }
    `);
  });

  it('allows using both `when` and `by` clauses', () => {
    check(`
      for a in b by 2 when a.c
        a
    `, `
      for (let i = 0; i < b.length; i += 2) {
        let a = b[i];
        if (a.c) {
          a;
        }
      }
    `);
  });

  it('extracts unsafe-to-repeat iteration targets before the for-in loop', () => {
    check(`
      for e in list()
        break
    `, `
      let iterable = list();
      for (let i = 0; i < iterable.length; i++) {
        let e = iterable[i];
        break;
      }
    `);
  });

  it.skip('special-cases for-in inclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [0..10]
        i
    `, `
      for (let i = 0; i <= 10; i++) {
        i;
      }
    `);
  });

  it.skip('special-cases for-in exclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [0...10]
        i
    `, `
      for (let i = 0; i < 10; i++) {
        i;
      }
    `);
  });

  it.skip('special-cases descending for-in inclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [10..0]
        i
    `, `
      for (let i = 10; i >= 0; i--) {
        i;
      }
    `);
  });

  it.skip('special-cases descending for-in exclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [10...0]
        i
    `, `
      for (let i = 10; i > 0; i--) {
        i;
      }
    `);
  });

  it.skip('special-cases descending for-in range loops with step count to avoid creating arrays', () => {
    check(`
      for i in [100..0] by -2
        i
    `, `
      for (let i = 100; i >= 0; i -= 2) {
        i;
      }
    `);
  });

  it('allows using an unsafe-to-repeat step value', () => {
    check(`
      for a in b by (c d)
        a()
    `, `
      for (let i = 0, step = c(d); i < b.length; i += step) {
        let a = b[i];
        a();
      }
    `);
  });

  it.skip('special-cases variable for-in range loops to avoid creating arrays', () => {
    check(`
      for i in [a..b]
        i
    `, `
      for (let i = a; a < b ? i <= b : i >= b; a < b ? i++ : i--) {
        i;
      }
    `);
  });

  it.skip('saves references to unsafe-to-repeat range bounds in variable for-in loops', () => {
    check(`
      for i in [a()..b()]
        i
    `, `
      let start = a();
      let end = b();
      for (let i = start; start < end ? i <= end : i >= end; start < end ? i++ : i--) {
        i;
      }
    `);
  });

  it('moves the body of a one-line for-of loop to the end', () => {
    check(`
      k for k of o
    `, `
      for (let k in o) { k; }
    `);
  });

  it('moves the body of a one-line for-in loop to the next line', () => {
    check(`
      e for e in l
    `, `
      for (let i = 0; i < l.length; i++) { let e = l[i]; e; }
    `);
  });

  it.skip('saves the list of results when for-of loops are used in an expression context', () => {
    check(`
      a(k for k of o)
    `, `
      a((() => {
        let result = [];
        for (let k in o) {
          result.push(k);
        }
        return result;
      })());
    `);
  });

  it('handles for-in loops used in an expression context', () => {
    check(`
      a(e for e in l)
    `, `
      a(l.map((e) => e));
    `);
  });

  it('handles for-in loops used as an implicit return', () => {
    check(`
      ->
        a for a in b
    `, `
      () => b.map((a) => a);
    `);
  });

  it('handles for-in loop expressions with a filter', () => {
    check(`
      f(a for a in b when c)
    `, `
      f(b.filter((a) => c).map((a) => a));
    `);
  });

  it('handles for-in loop expressions with an index', () => {
    check(`
      f(a + i for a, i in b)
    `, `
      f(b.map((a, i) => a + i));
    `);
  });

  it('handles for-in loop expressions with an object literal body', () => {
    check(`
      f({a: c, b: c} for c in d)
    `, `
      f(d.map((c) => ({a: c, b: c})));
    `);
  });

  it('correctly uses map with an index in for-in loop expressions', () => {
    validate(`
      sum = (arr) ->
        arr.reduce (a, b) -> a + b
      o = sum(3*x + i + 1 for x, i in [2, 5, 8])
    `, 51);
  });

  it.skip('handles for-in loop expressions with a block body', () => {
    check(`
      console.log(for x in [1, 2, 3]
        y = x + 1
        if y > 2
          y -= 1
        y + 2
      )
    `, `
      console.log([1, 2, 3].map(x => {
        let y = x + 1;
        if (y > 2) {
          y -= 1;
        }
        return y + 2;
      });
    `);
  });

  it.skip('handles for-in loop expressions with control flow', () => {
    // For now, the expected output is just the CoffeeScript output.
    check(`
      x = for a in f()
        b = g(a)
        if b > 3
          break
        b + 1
    `, `
      var a, b, x;

      x = (function() {
        var i, len, ref, results;
        ref = f();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          a = ref[i];
          b = g(a);
          if (b > 3) {
            break;
          }
          results.push(b + 1);
        }
        return results;
      })();
    `);
  });

  it.skip('closes the call to `result.push()` at the right position', () => {
    check(`
      ->
        for a in b
          if a
            b

      # this is here to make the real end of "a" be much later
      stuff
    `, `
      (function() {
        return (() => {
          let result = [];
          for (let i = 0, a; i < b.length; i++) {
            a = b[i];
            result.push((() => {
              if (a) {
                return b;
              }
            })());
          }
          return result;
        })();
      });

      // this is here to make the real end of "a" be much later
      stuff;
    `);
  });

  it('generates counters for nested loops that follow typical convention', () => {
    check(`
      for a in b
        for c in d
          a + c
    `, `
      for (let i = 0; i < b.length; i++) {
        let a = b[i];
        for (let j = 0; j < d.length; j++) {
          let c = d[j];
          a + c;
        }
      }
    `);
  });

  it.skip('handles `for own`', () => {
    check(`
      for own key of list
        console.log key
    `, `
      for (let key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          console.log(key);
        }
      }
    `);
  });

  it.skip('handles `for own` with an unsafe-to-repeat iterable', () => {
    check(`
      for own key of getList()
        console.log key
    `, `
      let iterable;
      for (let key in (iterable = getList())) {
        if (Object.prototype.hasOwnProperty.call(iterable, key)) {
          console.log(key);
        }
      }
    `);
  });

  it.skip('handles `for own` with both key and value', () => {
    check(`
      for own key, value of list
        console.log key, value
    `, `
      for (let key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          let value = list[key];
          console.log(key, value);
        }
      }
    `);
  });

  it.skip('handles `for own` with a filter', () => {
    check(`
      for own key of list when key[0] is '_'
        console.log key
    `, `
      for (let key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          if (key[0] === '_') {
            console.log(key);
          }
        }
      }
    `);
  });

  it.skip('handles single-line `for own`', () => {
    check(`
      for own a of b then a
    `, `
      for (let a in b) { if (Object.prototype.hasOwnProperty.call(b, a)) { a; } }
    `);
  });

  it('does not consider a `for` loop as an implicit return if it returns itself', () => {
    check(`
      ->
        for a in b
          return a
    `, `
      (function() {
        for (let i = 0; i < b.length; i++) {
          let a = b[i];
          return a;
        }
      });
    `);
  });

  it.skip('considers a `for` loop as an implicit return if it only returns within a function', () => {
    check(`
      ->
        for a in b
          -> return a
    `, `
      (function() {
        return (() => {
          let result = [];
          for (let i = 0, a; i < b.length; i++) {
            a = b[i];
            result.push(function() { return a; });
          }
          return result;
        })();
      });
    `);
  });

  it('preserves single-line `for-in` loops', () => {
    check(`
      for a in b then a()
    `, `
      for (let i = 0; i < b.length; i++) { let a = b[i]; a(); }
    `);
  });

  it('preserves single-line `for-of` loops', () => {
    check(`
      for k of o then k
    `, `
      for (let k in o) { k; }
    `);
  });

  it('handles multi-line body with `then`', () => {
    check(`
      for a in b then (->
        console.log('foo')
      )()
    `, `
      for (let i = 0; i < b.length; i++) { let a = b[i]; (() => console.log('foo'))(); }
    `);
  });

  it('handles destructuring as the first statement in a `for` body', () => {
    check(`
      for entry in someArray
        {x, y} = getPoint(entry)
        console.log x + ', ' + y;
    `, `
      for (let i = 0; i < someArray.length; i++) {
        let entry = someArray[i];
        let {x, y} = getPoint(entry);
        console.log(x + ', ' + y);
      }
    `);
  });

  it('handles for...when loops ending in implicit function calls', () =>
    check(`
      for a in b when c
        d e
    `, `
      for (let i = 0; i < b.length; i++) {
        let a = b[i];
        if (c) {
          d(e);
        }
      }
    `));

  it('handles for loops over implicit function calls', () =>
    check(`
      for a in b c
        d()
    `, `
      let iterable = b(c);
      for (let i = 0; i < iterable.length; i++) {
        let a = iterable[i];
        d();
      }
    `));
});
