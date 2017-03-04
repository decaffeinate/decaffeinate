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
        let v = o[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value plus unsafe-to-repeat target by saving a reference', () => {
    check(`
      for k, v of getObject()
        k
    `, `
      let object = getObject();
      for (let k in object) {
        let v = object[k];
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
      for key, {x, y} of getObject()
        key + x
    `, `
      let object = getObject();
      for (let key in object) {
        let {x, y} = object[key];
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
        let v = obj[k];
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
    `, { looseForOf: true });
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
        let result = [];
        let object = obj();
        for (let k in object) {
          let v = object[k];
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
        let result = [];
        let object = obj();
        for (let k in object) {
          let v = object[k];
          if (x) {
            let item;
            if (k) {
              item = k;
            } else if (v) {
              item = v;
            }
            result.push(item);
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
        let { a, b } = c[i];
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
        let i = 1;
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
      let x = [0, 1, 2].map((i) => a);
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
        let a = b[i];
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
      for (let i = 0; i < b.length; i++) { let a = b[i]; if (a.c) { a; } }
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

  it('extracts unsafe-to-repeat iteration targets before the for-in loop when there is an index', () => {
    check(`
      for e, i in list()
        break
    `, `
      let iterable = list();
      for (let i = 0; i < iterable.length; i++) {
        let e = iterable[i];
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
        let a = b[i];
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
        let result = [];
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
        let result = [];
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
      a(e for e in l)
    `, `
      a(Array.from(l).map((e) => e));
    `);
  });

  it('skips Array.from when using looseForExpressions', () => {
    check(`
      a(e for e in l)
    `, `
      a(l.map((e) => e));
    `, { looseForExpressions: true });
  });

  it('does not wrap in Array.from for for-in expressions over an array literal', () => {
    check(`
      a(b for b in [c, d])
    `, `
      a([c, d].map((b) => b));
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
        let result = [];
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
        let result = [];
        for (i = 0; i < l.length; i++) {
          let e = l[i];
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
        let result = [];
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
        a for a in b
    `, `
      () => Array.from(b).map((a) => a);
    `);
  });

  it('handles for-in loop expressions with a filter', () => {
    check(`
      f(a for a in b when c)
    `, `
      f(Array.from(b).filter((a) => c).map((a) => a));
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
      o = sum(3*x + i + 1 for x, i in [2, 5, 8])
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
        let result = [];
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
        let result = [];
        let iterable = [1, 2, 3];
        for (let i = 0; i < iterable.length; i++) {
          let x = iterable[i];
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
      let x = (() => {
        let result = [];
        for (let a of Array.from(f())) {
          let b = g(a);
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
        let result = [];
        for (let step = e, asc = step > 0, i = asc ? 0 : d.length - 1; asc ? i < d.length : i >= 0; i += step) {
          let c = d[i];
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
        let result = [];
        for (let i = 0; i < l.length; i++) {
          let x = l[i];
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
        let result = [];
        let iterable = l();
        for (let step = s, asc = step > 0, i = asc ? 0 : iterable.length - 1; asc ? i < iterable.length : i >= 0; i += step) {
          let x = iterable[i];
          if (x) {
            let item;
            if (i) {
              item = x;
            } else if (x) {
              item = i;
            }
            result.push(item);
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
          let result = [];
          for (let a of Array.from(b)) {
            let item;
            if (a) {
              item = b;
            }
            result.push(item);
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
        let a = b[i];
        for (let j = 0; j < d.length; j++) {
          let c = d[j];
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
        let value = list[key];
        console.log(key, value);
      }
    `);
  });

  it('handles `for own` with unsafe-to-repeat iterable with both key and value', () => {
    check(`
      for own key, value of getObject()
        console.log key, value
    `, `
      let object = getObject();
      for (let key of Object.keys(object || {})) {
        let value = object[key];
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
        let result = [];
        let object = obj();
        for (let k of Object.keys(object || {})) {
          let v = object[k];
          if (x) {
            let item;
            if (k) {
              item = k;
            } else if (v) {
              item = v;
            }
            result.push(item);
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
      for (let i = 0; i < b.length; i++) { let a = b[i]; (() => console.log('foo'))(); }
    `);
  });

  it('handles destructuring as the first statement in a `for` body', () => {
    check(`
      for entry in someArray
        {x, y} = getPoint(entry)
        console.log x + ', ' + y;
    `, `
      for (let entry of Array.from(someArray)) {
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
      let iterable = b(c);
      for (let i = 0; i < iterable.length; i++) {
        let a = iterable[i];
        d();
      }
    `));

  it('handles for loop expressions returning implicit objects', () =>
    check(`
      x = for a in b
        c: d
        e: f
    `, `
      let x = Array.from(b).map((a) => ({
        c: d,
        e: f
      }));
    `));

  it('handles for loop expressions ending in a break', () =>
    check(`
      x = for a in b
        break
    `, `
      let x = (() => {
        let result = [];
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
      let x = (() => {
        let result = [];
        for (let a of Array.from(b)) {
          let item;
          if (a) {
            item = a;
          } else if (b) {
            continue;
          }
          result.push(item);
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
      let filteredData = {};
      for (let k in data) {
        let v = data[k];
        if (v != null) {
          filteredData[k] = v;
        }
      }
    `);
  });

  it('handles a `when` clause with a `not of` in map/filter transformations', () => {
    check(`
      a = (b for b in c when b not of e)
    `, `
      let a = (Array.from(c).filter((b) => !(b in e)).map((b) => b));
    `);
  });

  it('handles a `when` clause with a `not of` operator', () => {
    check(`
      a = (b for b of c when d not of e)
    `, `
      let a = ((() => {
        let result = [];
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
        let b = (typeof c !== 'undefined' && c !== null ? c.d : undefined)[a];
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
      for (let step = c(d), asc = step > 0, i = asc ? 0 : b.length - 1; asc ? i < b.length : i >= 0; i += step) { let a = b[i]; a; }
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
      for (let step = c ? d : undefined, asc = step > 0, i = asc ? 0 : b.length - 1; asc ? i < b.length : i >= 0; i += step) { let a = b[i]; a; }
    `);
  });

  it('handles a complicated step', () => {
    check(`
      for a in b by c * d / e
        f
    `, `
      for (let step = (c * d) / e, asc = step > 0, i = asc ? 0 : b.length - 1; asc ? i < b.length : i >= 0; i += step) {
        let a = b[i];
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
        let a = value[value.length - 1];
        c;
      }
    `);
  });

  it('handles a complex assignee in a postfix loop', () => {
    check(`
      x = (a for [a = 1] in b)
    `, `
      let a, val;
      let x = (Array.from(b).map((value) => (val = value[0], a = val != null ? val : 1, value, a)));
    `);
  });

  it('handles a complex assignee in a for-of loop', () => {
    check(`
      for k, [..., v] of m
        k + v
    `, `
      for (let k in m) {
        let value = m[k];
        let v = value[value.length - 1];
        k + v;
      }
    `);
  });

  it('handles a multiline step in a postfix loop', () => {
    check(`
      a for b in c by do ->
        d
    `, `
      for (let step = (() => d)(), asc = step > 0, i = asc ? 0 : c.length - 1; asc ? i < c.length : i >= 0; i += step) { let b = c[i]; a; }
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
          let result = [];
          for (let i = 0; i < b.length; i++) {
            let a = b[i];
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
      let object = (left = a()) != null ? left : b;
      for (let k in object) {
        let v = object[k];
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
      let object = (left = a()) != null ? left : b;
      for (let k of Object.keys(object || {})) {
        let v = object[k];
        c;
      }
    `);
  });

  it('handles a post-for as a function argument', () => {
    check(`
      a(b for b in c, d)
    `, `
      a((Array.from(c).map((b) => b)), d);
    `);
  });

  it('handles a post-for as an array element', () => {
    check(`
      [a for a in b, c]
    `, `
      [(Array.from(b).map((a) => a)), c];
    `);
  });

  it('handles a post-for as an object element', () => {
    check(`
      {a: b for b in c, d}
    `, `
      ({a: (Array.from(c).map((b) => b)), d});
    `);
  });
});
