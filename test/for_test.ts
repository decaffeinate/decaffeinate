import check from './support/check';
import validate from './support/validate';

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
        const v = o[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value plus unsafe-to-repeat target by saving a reference', () => {
    check(`
      for k, v of getObject()
        k
    `, `
      const object = getObject();
      for (let k in object) {
        const v = object[k];
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
        const {x, y} = o[k];
        k + x;
      }
    `);
  });

  it('transforms for-of loops with destructured value plus unsafe-to-repeat target', () => {
    check(`
      for key, {x, y} of getObject()
        key + x
    `, `
      const object = getObject();
      for (let key in object) {
        const {x, y} = object[key];
        key + x;
      }
    `);
  });

  it('handles for-of statements with a filter', () => {
    check(`
      for k, v of obj when k == v
        console.log v
    `, `
      for (let k in obj) {
        const v = obj[k];
        if (k === v) {
          console.log(v);
        }
      }
    `);
  });

  it('transforms basic for-in loops to for-of loops', () => {
    check(`
      for a in b
        a
    `, `
      for (let a of Array.from(b)) {
        a;
      }
    `);
  });

  it('skips Array.from when generating a JS for-of loop in loose mode', () => {
    check(`
      for a in b
        a
    `, `
      for (let a of b) {
        a;
      }
    `, {
      options: {
        looseForOf: true
      }
    });
  });

  it('skips Array.from when iterating over an array literal', () => {
    check(`
      for a in [1, 2, 3]
        a
    `, `
      for (let a of [1, 2, 3]) {
        a;
      }
    `);
  });

  it('handles inline for-of loop expressions', () => {
    check(`
      a(k + v for k, v of obj() when k)
    `, `
      a((() => {
        const result = [];
        const object = obj();
        for (let k in object) {
          const v = object[k];
          if (k) {
            result.push(k + v);
          }
        }
        return result;
      })());
    `);
  });

  it('handles for-of loop expressions exercising many edge cases at once', () => {
    check(`
      a(for k, v of obj() when x
          if k
            k
          else if v
            v)
    `, `
      a((() => {
        const result = [];
        const object = obj();
        for (let k in object) {
          const v = object[k];
          if (x) {
            if (k) {
              result.push(k);
            } else if (v) {
              result.push(v);
            } else {
              result.push(undefined);
            }
          }
        }
        return result;
      })());
    `);
  });

  it('transforms for-in loops with an index to typical `for` loops', () => {
    check(`
      for a, j in b
        a
    `, `
      for (let j = 0; j < b.length; j++) {
        const a = b[j];
        a;
      }
    `);
  });

  it('transforms for-in loops with destructured value', () => {
    check(`
      for { a, b } in c
        a + b
    `, `
      for (let { a, b } of Array.from(c)) {
        a + b;
      }
    `);
  });

  it('transforms for-in loops with an index and a destructured value', () => {
    check(`
      for { a, b }, i in c
        a + b
    `, `
      for (let i = 0; i < c.length; i++) {
        const { a, b } = c[i];
        a + b;
      }
    `);
  });

  it('transforms `for` loops without an index or value', () => {
    check(`
      for [0..1]
        2
    `, `
      for (let i = 0; i <= 1; i++) {
        2;
      }
    `);
  });

  it('gives `for` loops without an index an index or value that does not collide with existing bindings', () => {
    check(`
      for [0..1]
        i = 1
    `, `
      for (let j = 0; j <= 1; j++) {
        const i = 1;
      }
    `);
  });

  it('allows the `by` clause to override the direction of a top-down range', () => {
    check(`
      for a in [10..5] by 1
        b()
    `, `
      for (let a = 10; a <= 5; a++) {
        b();
      }
    `);
  });

  it('iterates forwards on a forward range with a variable step', () => {
    check(`
      for a in [1..10] by b()
        c
    `, `
      for (let a = 1, step = b(); a <= 10; a += step) {
        c;
      }
    `);
  });

  it('iterates backwards on a backward range with a variable step', () => {
    check(`
      for a in [10..1] by b()
        c
    `, `
      for (let a = 10, step = b(); a >= 1; a += step) {
        c;
      }
    `);
  });

  it('iterates backwards on a forward range and a backward explicit step', () => {
    check(`
      for a in [1..10] by -1
        b
    `, `
      for (let a = 1; a >= 10; a--) {
        b;
      }
    `);
  });

  it('allows the `by` clause to force reverse iteration', () => {
    check(`
      for a in [b..c] by -1
        d
    `, `
      for (let a = b, end = c; a >= end; a--) {
        d;
      }
    `);
  });

  it('has an unknown iteration order when the `by` clause is a variable', () => {
    check(`
      for a in [b..c] by d
        e
    `, `
      for (let a = b, end = c, step = d, asc = step > 0; asc ? a <= end : a >= end; a += step) {
        e;
      }
    `);
  });


  it('transforms an exclusive range by using non-equal tests', () => {
    check(`
      for i in [1...3]
        console.log(i)
    `, `
      for (let i = 1; i < 3; i++) {
        console.log(i);
      }
    `);
  });

  it('transforms top-down ranges loops by decrementing an index', () => {
    check(`
      for i in [5..3]
        console.log(i)
    `, `
      for (let i = 5; i >= 3; i--) {
        console.log(i);
      }
    `);
  });

  it('transforms `for` loops without an index or value in expanded form', () => {
    check(`
      for [a..b] by 1
        2
    `, `
      for (let i = a, end = b; i <= end; i++) {
        2;
      }
    `);
  });

  it('transforms `for` loops with a range but without a step', () => {
    check(`
      for n in [a..b]
        n
    `, `
      for (let n = a, end = b, asc = a <= end; asc ? n <= end : n >= end; asc ? n++ : n--) {
        n;
      }
    `);
  });

  it('transforms `for` loops with a complex range but without a step using `for(;;)`, extracting the start', () => {
    check(`
      for n in [a()..b()]
        n
    `, `
      for (let start = a(), n = start, end = b(), asc = start <= end; asc ? n <= end : n >= end; asc ? n++ : n--) {
        n;
      }
    `);
  });

  it('transforms expression-style `for` loops without an index or value', () => {
    check(`
      x = for [0..2] then a
    `, `
      const x = [0, 1, 2].map((i) => a);
    `);
  });

  it('allows iterating with for-in by a specific step size', () => {
    check(`
      for a in b by 2
        a
    `, `
      for (let i = 0; i < b.length; i += 2) {
        const a = b[i];
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
        const a = b[i];
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
        const a = b[i];
        a;
      }
    `);
  });

  it('allows filtering using a `when` clause', () => {
    check(`
      for a in b when a.c
        a
    `, `
      for (let a of Array.from(b)) {
        if (a.c) {
          a;
        }
      }
    `);
  });

  it('allows filtering using a `when` clause with an index', () => {
    check(`
      for a, i in b when a.c
        a
    `, `
      for (let i = 0; i < b.length; i++) {
        const a = b[i];
        if (a.c) {
          a;
        }
      }
    `);
  });

  it('handles inline for-in statements with a condition', () => {
    check(`
      for a in b when a.c then a
    `, `
      for (let a of Array.from(b)) { if (a.c) { a; } }
    `);
  });

  it('handles inline for-in statements with a condition and an index', () => {
    check(`
      for a, i in b when a.c then a
    `, `
      for (let i = 0; i < b.length; i++) { const a = b[i]; if (a.c) { a; } }
    `);
  });

  it('allows using both `when` and `by` clauses', () => {
    check(`
      for a in b by 2 when a.c
        a
    `, `
      for (let i = 0; i < b.length; i += 2) {
        const a = b[i];
        if (a.c) {
          a;
        }
      }
    `);
  });

  it('extracts unsafe-to-repeat iteration targets before the for-in loop when there is an index', () => {
    check(`
      for e, i in list()
        break
    `, `
      const iterable = list();
      for (let i = 0; i < iterable.length; i++) {
        const e = iterable[i];
        break;
      }
    `);
  });

  it('does not extract unsafe-to-repeat iteration when creating a for-of loop', () => {
    check(`
      for e in list()
        break
    `, `
      for (let e of Array.from(list())) {
        break;
      }
    `);
  });

  it('special-cases for-in inclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [0..10]
        i
    `, `
      for (let i = 0; i <= 10; i++) {
        i;
      }
    `);
  });

  it('special-cases for-in exclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [0...10]
        i
    `, `
      for (let i = 0; i < 10; i++) {
        i;
      }
    `);
  });

  it('special-cases descending for-in inclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [10..0]
        i
    `, `
      for (let i = 10; i >= 0; i--) {
        i;
      }
    `);
  });

  it('special-cases descending for-in exclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [10...0]
        i
    `, `
      for (let i = 10; i > 0; i--) {
        i;
      }
    `);
  });

  it('special-cases descending for-in range loops with step count to avoid creating arrays', () => {
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
      for (let step = c(d), asc = step > 0, i = asc ? 0 : b.length - 1; asc ? i < b.length : i >= 0; i += step) {
        const a = b[i];
        a();
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
      for (let e of Array.from(l)) { e; }
    `);
  });

  it('handles for-of loops used in an expression context', () => {
    check(`
      a(k for k of o)
    `, `
      a((() => {
        const result = [];
        for (let k in o) {
          result.push(k);
        }
        return result;
      })());
    `);
  });

  it('handles for-of loops with condition used in an expression context', () => {
    check(`
      a(k for k of o when c)
    `, `
      a((() => {
        const result = [];
        for (let k in o) {
          if (c) {
            result.push(k);
          }
        }
        return result;
      })());
    `);
  });

  it('handles for-in loops used in an expression context', () => {
    check(`
      a(f for e in l)
    `, `
      a(Array.from(l).map((e) => f));
    `);
  });

  it('skips Array.from when using looseForExpressions', () => {
    check(`
      a(f for e in l)
    `, `
      a(l.map((e) => f));
    `, {
      options: {
        looseForExpressions: true
      }
    });
  });

  it('does not wrap in Array.from for for-in expressions over an array literal', () => {
    check(`
      a(e for b in [c, d])
    `, `
      a([c, d].map((b) => e));
    `);
  });

  it('does not use map when the value assignee is used externally', () => {
    check(`
      a(for e in l
        e)
      console.log e
    `, `
      let e;
      a((() => {
        const result = [];
        for (e of Array.from(l)) {
          result.push(e);
        }
        return result;
      })());
      console.log(e);
    `);
  });

  it('does not use map when the key assignee is used externally', () => {
    check(`
      a(for e, i in l
        e)
      console.log i
    `, `
      let i;
      a((() => {
        const result = [];
        for (i = 0; i < l.length; i++) {
          const e = l[i];
          result.push(e);
        }
        return result;
      })());
      console.log(i);
    `);
  });

  it('does not use map when the loop assignee is not an identifier', () => {
    check(`
      a(for @e in l
        @e)
    `, `
      a((() => {
        const result = [];
        for (this.e of Array.from(l)) {
          result.push(this.e);
        }
        return result;
      })());
    `);
  });

  it('handles for-in loops used as an implicit return', () => {
    check(`
      ->
        c for a in b
    `, `
      () => Array.from(b).map((a) => c);
    `);
  });

  it('handles for-in loop expressions with a filter', () => {
    check(`
      f(d for a in b when c)
    `, `
      f(Array.from(b).filter((a) => c).map((a) => d));
    `);
  });

  it('handles for-in loop expressions with an index', () => {
    check(`
      f(a + i for a, i in b)
    `, `
      f(Array.from(b).map((a, i) => a + i));
    `);
  });

  it('handles for-in loop expressions with an object literal body', () => {
    check(`
      f({a: c, b: c} for c in d)
    `, `
      f(Array.from(d).map((c) => ({a: c, b: c})));
    `);
  });

  it('handles for-in loop expressions with a complex body starting with an object literal', () => {
    check(`
      f({a: c, b: c}['a'] for c in d)
    `, `
      f(Array.from(d).map((c) => ({a: c, b: c}['a'])));
    `);
  });

  it('handles for-in loop expressions with implicit object literal bodies', () => {
    check(`
      f(a: b for c in d)
    `, `
      f(Array.from(d).map((c) => ({a: b})));
    `);
  });

  it('correctly uses map with an index in for-in loop expressions', () => {
    validate(`
      sum = (arr) ->
        arr.reduce (a, b) -> a + b
      setResult(sum(3*x + i + 1 for x, i in [2, 5, 8]))
    `, 51);
  });

  it('handles for-in loop expressions with a block body', () => {
    check(`
      console.log(for x in [1, 2, 3]
        y = x + 1
        if y > 2
          y -= 1
        y + 2)
    `, `
      console.log((() => {
        const result = [];
        for (let x of [1, 2, 3]) {
          let y = x + 1;
          if (y > 2) {
            y -= 1;
          }
          result.push(y + 2);
        }
        return result;
      })());
    `);
  });

  it('handles for-in loop expressions with a block body and an index', () => {
    check(`
      console.log(for x, i in [1, 2, 3]
        y = x + 1
        if y > 2
          y -= 1
        y + 2)
    `, `
      console.log((() => {
        const result = [];
        const iterable = [1, 2, 3];
        for (let i = 0; i < iterable.length; i++) {
          const x = iterable[i];
          let y = x + 1;
          if (y > 2) {
            y -= 1;
          }
          result.push(y + 2);
        }
        return result;
      })());
    `);
  });

  it('handles for-in loop expressions with control flow', () => {
    check(`
      x = for a in f()
        b = g(a)
        if b > 3
          break
        b + 1
    `, `
      const x = (() => {
        const result = [];
        for (let a of Array.from(f())) {
          const b = g(a);
          if (b > 3) {
            break;
          }
          result.push(b + 1);
        }
        return result;
      })();
    `);
  });

  it('handles for-in loop expressions with a step', () => {
    check(`
      a(b for c in d by e)
    `, `
      a((() => {
        const result = [];
        for (let step = e, asc = step > 0, i = asc ? 0 : d.length - 1; asc ? i < d.length : i >= 0; i += step) {
          const c = d[i];
          result.push(b);
        }
        return result;
      })());
    `);
  });

  it('handles for-in loop expressions with a filter and a key assignee', () => {
    check(`
      a(b for x, i in l when c)
    `, `
      a((() => {
        const result = [];
        for (let i = 0; i < l.length; i++) {
          const x = l[i];
          if (c) {
            result.push(b);
          }
        }
        return result;
      })());
    `);
  });

  it('handles for-in loop expressions exercising many edge cases at once', () => {
    check(`
      a(for x, i in l() when x by s
          if i
            x
          else if x
            i)
    `, `
      a((() => {
        const result = [];
        const iterable = l();
        for (let step = s, asc = step > 0, i = asc ? 0 : iterable.length - 1; asc ? i < iterable.length : i >= 0; i += step) {
          const x = iterable[i];
          if (x) {
            if (i) {
              result.push(x);
            } else if (x) {
              result.push(i);
            } else {
              result.push(undefined);
            }
          }
        }
        return result;
      })());
    `);
  });

  it('closes the call to `result.push()` at the right position', () => {
    check(`
      ->
        for a in b
          if a
            b

      # this is here to make the real end of "a" be much later
      stuff
    `, `
      () =>
        (() => {
          const result = [];
          for (let a of Array.from(b)) {
            if (a) {
              result.push(b);
            } else {
              result.push(undefined);
            }
          }
          return result;
        })()
      ;
      
      // this is here to make the real end of "a" be much later
      stuff;
    `);
  });

  it('generates counters for nested loops that follow typical convention', () => {
    check(`
      for a in b by 1
        for c in d by 1
          a + c
    `, `
      for (let i = 0; i < b.length; i++) {
        const a = b[i];
        for (let j = 0; j < d.length; j++) {
          const c = d[j];
          a + c;
        }
      }
    `);
  });

  it('handles `for own`', () => {
    check(`
      for own key of list
        console.log key
    `, `
      for (let key of Object.keys(list || {})) {
        console.log(key);
      }
    `);
  });

  it('handles `for own` with an unsafe-to-repeat iterable', () => {
    check(`
      for own key of getObject()
        console.log key
    `, `
      for (let key of Object.keys(getObject() || {})) {
        console.log(key);
      }
    `);
  });

  it('handles `for own` with both key and value', () => {
    check(`
      for own key, value of list
        console.log key, value
    `, `
      for (let key of Object.keys(list || {})) {
        const value = list[key];
        console.log(key, value);
      }
    `);
  });

  it('handles `for own` with unsafe-to-repeat iterable with both key and value', () => {
    check(`
      for own key, value of getObject()
        console.log key, value
    `, `
      const object = getObject();
      for (let key of Object.keys(object || {})) {
        const value = object[key];
        console.log(key, value);
      }
    `);
  });

  it('handles `for own` with a filter', () => {
    check(`
      for own key of list when key[0] is '_'
        console.log key
    `, `
      for (let key of Object.keys(list || {})) {
        if (key[0] === '_') {
          console.log(key);
        }
      }
    `);
  });

  it('handles single-line `for own`', () => {
    check(`
      for own a of b then a
    `, `
      for (let a of Object.keys(b || {})) { a; }
    `);
  });

  it('handles `for own` loop expressions exercising many edge cases at once', () => {
    check(`
      a(for own k, v of obj() when x
          if k
            k
          else if v
            v)
    `, `
      a((() => {
        const result = [];
        const object = obj();
        for (let k of Object.keys(object || {})) {
          const v = object[k];
          if (x) {
            if (k) {
              result.push(k);
            } else if (v) {
              result.push(v);
            } else {
              result.push(undefined);
            }
          }
        }
        return result;
      })());
    `);
  });

  it('does not consider a `for` loop as an implicit return if it returns itself', () => {
    check(`
      ->
        for a in b
          return a
    `, `
      (function() {
        for (let a of Array.from(b)) {
          return a;
        }
      });
    `);
  });

  it('considers a `for` loop as an implicit return if it only returns within a function', () => {
    check(`
      ->
        for a in b
          -> return a
    `, `
      () =>
        Array.from(b).map((a) =>
          () => a)
      ;
    `);
  });

  it('preserves single-line `for-in` loops', () => {
    check(`
      for a in b then a()
    `, `
      for (let a of Array.from(b)) { a(); }
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
      for (let a of Array.from(b)) { (() => console.log('foo'))(); }
    `);
  });

  it('handles multi-line body with index and `then`', () => {
    check(`
      for a, i in b then (->
        console.log('foo')
      )()
    `, `
      for (let i = 0; i < b.length; i++) { const a = b[i]; (() => console.log('foo'))(); }
    `);
  });

  it('handles destructuring as the first statement in a `for` body', () => {
    check(`
      for entry in someArray
        {x, y} = getPoint(entry)
        console.log x + ', ' + y;
    `, `
      for (let entry of Array.from(someArray)) {
        const {x, y} = getPoint(entry);
        console.log(x + ', ' + y);
      }
    `);
  });

  it('handles for...when loops ending in implicit function calls', () =>
    check(`
      for a in b when c
        d e
    `, `
      for (let a of Array.from(b)) {
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
      for (let a of Array.from(b(c))) {
        d();
      }
    `));

  it('handles for loops with an index over implicit function calls', () =>
    check(`
      for a, i in b c
        d()
    `, `
      const iterable = b(c);
      for (let i = 0; i < iterable.length; i++) {
        const a = iterable[i];
        d();
      }
    `));

  it('handles for loop expressions returning implicit objects', () =>
    check(`
      x = for a in b
        c: d
        e: f
    `, `
      const x = Array.from(b).map((a) => ({
        c: d,
        e: f
      }));
    `));

  it('handles for loop expressions ending in a break', () =>
    check(`
      x = for a in b
        break
    `, `
      const x = (() => {
        const result = [];
        for (let a of Array.from(b)) {
          break;
        }
        return result;
      })();
    `));

  it('handles for loop expressions with multiple branches including a control flow statement', () =>
    check(`
      x = for a in b
        if a
          a
        else if b
          continue
    `, `
      const x = (() => {
        const result = [];
        for (let a of Array.from(b)) {
          if (a) {
            result.push(a);
          } else if (b) {
            continue;
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    `));

  it('handles a `when` clause with existence operator', () => {
    check(`
      filteredData = {}
      for k, v of data when v?
        filteredData[k] = v
    `, `
      const filteredData = {};
      for (let k in data) {
        const v = data[k];
        if (v != null) {
          filteredData[k] = v;
        }
      }
    `);
  });

  it('handles a `when` clause with a `not of` in map/filter transformations', () => {
    check(`
      a = (f for b in c when b not of e)
    `, `
      const a = (Array.from(c).filter((b) => !(b in e)).map((b) => f));
    `);
  });

  it('handles a `when` clause with a `not of` operator', () => {
    check(`
      a = (b for b of c when d not of e)
    `, `
      const a = ((() => {
        const result = [];
        for (let b in c) {
          if (!(d in e)) {
            result.push(b);
          }
        }
        return result;
      })());
    `);
  });

  it('handles a soak operation as a loop target', () => {
    check(`
      for a, b of c?.d
        console.log a
    `, `
      for (let a in (typeof c !== 'undefined' && c !== null ? c.d : undefined)) {
        const b = (typeof c !== 'undefined' && c !== null ? c.d : undefined)[a];
        console.log(a);
      }
    `);
  });

  it('handles this-assignment in a loop variable', () => {
    check(`
      for @a in b
        c
    `, `
      for (this.a of Array.from(b)) {
        c;
      }
    `);
  });

  it('properly patches the target in for-of loops', () => {
    check(`
      for a of @b
        c
    `, `
      for (let a in this.b) {
        c;
      }
    `);
  });

  it('handles implicit function calls in the loop step', () => {
    check(`
      a for a in b by c d
    `, `
      for (let step = c(d), asc = step > 0, i = asc ? 0 : b.length - 1; asc ? i < b.length : i >= 0; i += step) { const a = b[i]; a; }
    `);
  });

  it('handles a condition containing "then" within a post-for', () => {
    check(`
      a for a in b when if c then d
    `, `
      for (let a of Array.from(b)) { if (c ? d : undefined) { a; } }
    `);
  });

  it('handles a target containing "then" within a post-for', () => {
    check(`
      a for a in if b then c
    `, `
      for (let a of Array.from((b ? c : undefined))) { a; }
    `);
  });

  it('handles a step containing "then" within a post-for', () => {
    check(`
      a for a in b by if c then d
    `, `
      for (let step = c ? d : undefined, asc = step > 0, i = asc ? 0 : b.length - 1; asc ? i < b.length : i >= 0; i += step) { const a = b[i]; a; }
    `);
  });

  it('handles a complicated step', () => {
    check(`
      for a in b by c * d / e
        f
    `, `
      for (let step = (c * d) / e, asc = step > 0, i = asc ? 0 : b.length - 1; asc ? i < b.length : i >= 0; i += step) {
        const a = b[i];
        f;
      }
    `);
  });

  it('handles an assignee with an expansion node', () => {
    check(`
      for [..., a] in b
        c
    `, `
      for (let value of Array.from(b)) {
        const a = value[value.length - 1];
        c;
      }
    `);
  });

  it('handles a complex assignee in a postfix loop', () => {
    check(`
      x = (a for [a = 1] in b)
    `, `
      const x = ((() => {
        const result = [];
        for (let value of Array.from(b)) {     const val = value[0], a = val != null ? val : 1; result.push(a);
        }
        return result;
      })());
    `);
  });

  it('handles a complex assignee in a for-of loop', () => {
    check(`
      for k, [..., v] of m
        k + v
    `, `
      for (let k in m) {
        const value = m[k];
        const v = value[value.length - 1];
        k + v;
      }
    `);
  });

  it('handles a multiline step in a postfix loop', () => {
    check(`
      a for b in c by do ->
        d
    `, `
      for (let step = (() => d)(), asc = step > 0, i = asc ? 0 : c.length - 1; asc ? i < c.length : i >= 0; i += step) { const b = c[i]; a; }
    `);
  });

  it('handles a deeply nested yield in an IIFE loop', () => {
    check(`
      ->
        for a in b by 1
            ->
              c
              ->
                yield d

    `, `
      () =>
        (() => {
          const result = [];
          for (let i = 0; i < b.length; i++) {
            const a = b[i];
            result.push(function() {
              c;
              return function*() {
                return yield d;
              };
            });
          }
          return result;
        })()
      ;
    `);
  });

  it('handles an existence op for-of loop target with a non-repeatable LHS', () => {
    check(`
      for k, v of a() ? b
        c
    `, `
      let left;
      const object = (left = a()) != null ? left : b;
      for (let k in object) {
        const v = object[k];
        c;
      }
    `);
  });

  it('handles an existence op for-own loop target with a non-repeatable LHS', () => {
    check(`
      for own k, v of a() ? b
        c
    `, `
      let left;
      const object = (left = a()) != null ? left : b;
      for (let k of Object.keys(object || {})) {
        const v = object[k];
        c;
      }
    `);
  });

  it('handles a post-for as a function argument', () => {
    check(`
      a(e for b in c, d)
    `, `
      a((Array.from(c).map((b) => e)), d);
    `);
  });

  it('handles a post-for as an array element', () => {
    check(`
      [d for a in b, c]
    `, `
      [(Array.from(b).map((a) => d)), c];
    `);
  });

  it('handles a post-for as an object element', () => {
    check(`
      {a: e for b in c, d}
    `, `
      ({a: (Array.from(c).map((b) => e)), d});
    `);
  });

  it('properly converts a postfix for followed by a semicolon', () => {
    check(`
      foo = () -> null for i in []; t
    `, `
      const foo = function() { for (let i of []) { null; } return t; };
    `);
  });

  it('handles break in a postfix for', () => {
    check(`
      (a; break) for b in c
    `, `
      for (let b of Array.from(c)) { a; break; }
    `);
  });

  it('generates an IIFE rather than a comma expression for a multi-statement expression loop', () => {
    check(`
      loadScripts = ->
        for path in Options.scripts
          if path[0] == '/'
            scriptsPath = path
          else
            scriptsPath = Path.resolve ".", path
          robot.load scriptsPath
    `, `
      const loadScripts = () =>
        (() => {
          const result = [];
          for (let path of Array.from(Options.scripts)) {
            var scriptsPath;
            if (path[0] === '/') {
              scriptsPath = path;
            } else {
              scriptsPath = Path.resolve(".", path);
            }
            result.push(robot.load(scriptsPath));
          }
          return result;
        })()
      ;
    `);
  });

  it('does not use map when the body contains a yield statement', () => {
    check(`
      ->
        yield i for i in [3..4]
    `, `
      (function*() {
        return yield* (function*() {
          const result = [];
          for (let i = 3; i <= 4; i++) {
            result.push(yield i);
          }
          return result;
        }).call(this);
      });
    `);
  });

  it('does not allow modifying the loop index of a for-in loop', () => {
    check(`
      arr = [1, 2, 3]
      for val, i in arr
        console.log i
        i = 10
    `, `
      const arr = [1, 2, 3];
      for (let j = 0, i = j; j < arr.length; j++, i = j) {
        const val = arr[i];
        console.log(i);
        i = 10;
      }
    `);
  });

  it('defensively sets the loop index when it might be set within a closure', () => {
    check(`
      arr = [1, 2, 3]
      i = 0
      f = -> i = 10
      for val, i in arr
        console.log i
        f()
    `, `
      let j;
      const arr = [1, 2, 3];
      let i = 0;
      const f = () => i = 10;
      for (j = 0, i = j; j < arr.length; j++, i = j) {
        const val = arr[i];
        console.log(i);
        f();
      }
    `);
  });

  it('does not defensively sets the loop index when running a loop twice', () => {
    check(`
      arr = [1, 2, 3]
      for val, i in arr
        console.log i
      for val, i in arr
        console.log i
    `, `
      let i, val;
      const arr = [1, 2, 3];
      for (i = 0; i < arr.length; i++) {
        val = arr[i];
        console.log(i);
      }
      for (i = 0; i < arr.length; i++) {
        val = arr[i];
        console.log(i);
      }
    `);
  });

  it('properly sets the loop variable before and after', () => {
    validate(`
      values = []
      i = 50
      arr = [10, 20, 30]
      for val, i in arr
        values.push(i)
        i = 100
      values.push(i)
      setResult(values)
    `, [0, 1, 2, 3]);
  });

  it('properly saves the loop assignee for range loops', () => {
    check(`
      for i in [a..b]
        console.log i
        i = 100
    `, `
      for (let j = a, i = j, end = b, asc = a <= end; asc ? j <= end : j >= end; asc ? j++ : j--, i = j) {
        console.log(i);
        i = 100;
      }
    `);
  });

  it('does not add elements for implicit return switch within a loop expression', () => {
    check(`
      arr = for a in b
        switch a
          when 0
            a
          when 1
            break
          when 2 then
    `, `
      const arr = (() => {
        const result = [];
        for (let a of Array.from(b)) {
          switch (a) {
            case 0:
              result.push(a);
              break;
            case 1:
              break;
            case 2:
              break;
            default:
              result.push(undefined);
          }
        }
        return result;
      })();
    `);
  });

  it('does not add to the array with an explicit empty else case in a loop expression', () => {
    check(`
      arr = for a in b
        switch c
          when d then e
          else
    `, `
      const arr = (() => {
        const result = [];
        for (let a of Array.from(b)) {
          switch (c) {
            case d: result.push(e); break;
            default:
          }
        }
        return result;
      })();
    `);
  });

  it('does not add to the array with an explicit empty else in a loop expression', () => {
    check(`
      arr = for i in [1, 2, 3]
        if a
          b
        else
    `, `
      const arr = (() => {
        const result = [];
        for (let i of [1, 2, 3]) {
          if (a) {
            result.push(b);
          }
          else {}
        }
        return result;
      })();
    `);
  });

  it('properly handles an implicit-return switch with an if/else as a case', () => {
    check(`
      x = for a in b
        switch c
          when d
            if e then f
            else g
    `, `
      const x = (() => {
        const result = [];
        for (let a of Array.from(b)) {
          switch (c) {
            case d:
              if (e) { result.push(f);
              } else { result.push(g); }
              break;
            default:
              result.push(undefined);
          }
        }
        return result;
      })();
    `);
  });

  it('handles an incomplete conditional ending in a comment in a loop expression', () => {
    check(`
      arr = for a in b
        if c
          d  # e
    `, `
      const arr = (() => {
        const result = [];
        for (let a of Array.from(b)) {
          if (c) {
            result.push(d);  // e
          } else {
            result.push(undefined);
          }
        }
        return result;
      })();
    `);
  });

  it('saves the loop index when it is modified but not assigned in the body', () => {
    check(`
      for a, i in arr
        i += 5
    `, `
      for (let j = 0, i = j; j < arr.length; j++, i = j) {
        const a = arr[i];
        i += 5;
      }
    `);
  });

  it('saves the loop index when it is modified in an increment but not assigned in the body', () => {
    check(`
      for a, i in arr
        i++
    `, `
      for (let j = 0, i = j; j < arr.length; j++, i = j) {
        const a = arr[i];
        i++;
      }
    `);
  });

  it('saves the loop index when it is modified in an inner closure but not assigned in the body', () => {
    check(`
      i = 0
      f = ->
        i++
      for a, i in arr
        f()
    `, `
      let j;
      let i = 0;
      const f = () => i++;
      for (j = 0, i = j; j < arr.length; j++, i = j) {
        const a = arr[i];
        f();
      }
    `);
  });

  it('handles a for-in loop with an empty body', () => {
    check(`
      for a in b then
    `, `
      for (let a of Array.from(b)) {} 
    `);
  });

  it('handles a for-of loop with an empty body', () => {
    check(`
      for a of b then
    `, `
      for (let a in b) {} 
    `);
  });

  it('handles a for-own loop with an empty body', () => {
    check(`
      for own a of b then
    `, `
      for (let a of Object.keys(b || {})) {} 
    `);
  });

  it('declares bindings for IIFE-style loops in an outer scope if necessary', () => {
    check(`
      a
      x = (a for a in [])
    `, `
      let a;
      a;
      const x = ((() => {
        const result = [];
        for (a of []) {     result.push(a);
        }
        return result;
      })());
    `);
  });

  it('does not crash with a variable access followed by an IIFE-style loop declaring the variable', () => {
    validate(`
      a
      x = (a for a in [])
      setResult('did not crash')
    `, 'did not crash');
  });

  it('does not crash on a semicolon-only body for a loop expression', () => {
    check(`
      x = for a in b
        ;
    `, `
      const x = Array.from(b).map((a) =>
        undefined);
    `);
  });

  it('does not crash on a body ending in a semicolon', () => {
    check(`
      x = for a in b
        c;
    `, `
      const x = Array.from(b).map((a) =>
        c);
    `);
  });

  it('skips map on a no-op map with filter', () => {
    check(`
      -> a for a in b when a > 0
    `, `
      () => Array.from(b).filter((a) => a > 0);
    `);
  });

  it('skips map on a no-op map without filter', () => {
    check(`
      -> a for a in b
    `, `
      () => Array.from(b);
    `);
  });

  it('allows an expression loop with an empty body and does not populate the result array', () => {
    check(`
      x = for a in b then
    `, `
      const x = (() => {
        const result = [];
        for (let a of Array.from(b)) {}
        return result;
      })(); 
    `);
  });

  it('does not convert to filter and map when the condition might have a side-effect', () => {
    check(`
      x = for a in [1, 2, 3] when b = a - 1
        b
    `, `
      const x = (() => {
        const result = [];
        for (let a of [1, 2, 3]) {
          var b;
          if ((b = a - 1)) {
            result.push(b);
          }
        }
        return result;
      })();
    `);
  });

  it('behaves correctly on side-effects', () => {
    validate(`
      setResult(for a in [1, 2, 3] when b = a - 1 then b)
    `,
      [1, 2]
    );
  });

  it('handles an IIFE for-in with an assignment followed by access', () => {
    check(`
      a =
        for b in c
          d = e
          break
      d
    `, `
      let d;
      const a =
        (() => {
        const result = [];
        for (let b of Array.from(c)) {
          d = e;
          break;
        }
        return result;
      })();
      d;
    `);
  });

  it('handles an IIFE for-of with an assignment followed by access', () => {
    check(`
      a =
        for b of c
          d = e
      d
    `, `
      let d;
      const a =
        (() => {
        const result = [];
        for (let b in c) {
          result.push(d = e);
        }
        return result;
      })();
      d;
    `);
  });

  it('handles for...from statements', () => {
    check(`
      for a from b
        c
    `, `
      for (let a of b) {
        c;
      }
    `);
  });

  it('handles for...from expressions', () => {
    check(`
      a = (for c from d then b)
    `, `
      const a = (Array.from(d).map((c) => b));
    `);
  });

  it('handles postfix for...from expressions', () => {
    check(`
      a = (b for c from d)
    `, `
      const a = (Array.from(d).map((c) => b));
    `);
  });

  it('allows @index assignees in for expressions', () => {
    check(`
      ->
        for a, @i in arr
          c
        return
    `, `
      (function() {
        let i;
        for (i = 0, this.i = i; i < arr.length; i++, this.i = i) {
          const a = arr[this.i];
          c;
        }
      });
    `);
  });

  it('disallows loop expressions when there is an index binding', () => {
    check(`
      x = (for a, @i in arr then c)
    `, `
      const x = ((() => {
        let i;
        const result = [];
        for (i = 0, this.i = i; i < arr.length; i++, this.i = i) {
          const a = arr[this.i];
          result.push(c);
        }
        return result;
      })());
    `);
  });

  it('handles @key assignees for CS for...of loops', () => {
    check(`
      for @key, value of obj
        a
    `, `
      for (this.key in obj) {
        const value = obj[this.key];
        a;
      }
    `);
  });
});
