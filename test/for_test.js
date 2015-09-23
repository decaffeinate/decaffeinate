import check from './support/check';

describe('for loops', () => {
  it('transforms basic for-of loops into for-in', () => {
    check(`
      for k of o
        k
    `, `
      for (var k in o) {
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value into for-in', () => {
    check(`
      for k, v of o
        k
    `, `
      for (var k in o) {
        var v = o[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value plus unsafe-to-repeat target by saving a reference', () => {
    check(`
      for k, v of object()
        k
    `, `
      var iterable;
      for (var k in (iterable = object())) {
        var v = iterable[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with destructured keys', () => {
    check(`
      for {a, b} of o
        a + b
    `, `
      for (var {a, b} in o) {
        a + b;
      }
    `);
  });

  it('transforms for-of loops with destructured keys and values', () => {
    check(`
      for {a, b}, {x, y} of o
        a + x
    `, `
      for (var key in o) {
        var {a, b} = key;
        var {x, y} = o[key];
        a + x;
      }
    `);
  });

  it('transforms for-of loops with destructured keys and values plus unsafe-to-repeat target', () => {
    check(`
      for {a, b}, {x, y} of object()
        a + x
    `, `
      var iterable;
      for (var key in (iterable = object())) {
        var {a, b} = key;
        var {x, y} = iterable[key];
        a + x;
      }
    `);
  });

  it('transforms for-in loops to typical `for` loops', () => {
    check(`
      for a in b
        a
    `, `
      for (var i = 0, a; i < b.length; i++) {
        a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in by a specific step size', () => {
    check(`
      for a in b by 2
        a
    `, `
      for (var i = 0, a; i < b.length; i += 2) {
        a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in in reverse', () => {
    check(`
      for a in b by -1
        a
    `, `
      for (var i = b.length - 1, a; i >= 0; i--) {
        a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in in reverse with a specific step size', () => {
    check(`
      for a in b by -2
        a
    `, `
      for (var i = b.length - 1, a; i >= 0; i -= 2) {
        a = b[i];
        a;
      }
    `);
  });

  it('allows filtering using a `when` clause', () => {
    check(`
      for a in b when a.c
        a
    `, `
      for (var i = 0, a; i < b.length; i++) {
        a = b[i];
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
      for (var i = 0, a; i < b.length; i += 2) {
        a = b[i];
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
      var iterable = list();
      for (var i = 0, e; i < iterable.length; i++) {
        e = iterable[i];
        break;
      }
    `);
  });

  it('special-cases for-in inclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [0..10]
        i
    `, `
      for (var i = 0; i <= 10; i++) {
        i;
      }
    `);
  });

  it('special-cases for-in exclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [0...10]
        i
    `, `
      for (var i = 0; i < 10; i++) {
        i;
      }
    `);
  });

  it('special-cases descending for-in inclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [10..0]
        i
    `, `
      for (var i = 10; i >= 0; i--) {
        i;
      }
    `);
  });

  it('special-cases descending for-in exclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [10...0]
        i
    `, `
      for (var i = 10; i > 0; i--) {
        i;
      }
    `);
  });

  it('special-cases descending for-in range loops with step count to avoid creating arrays', () => {
    check(`
      for i in [100..0] by -2
        i
    `, `
      for (var i = 100; i >= 0; i -= 2) {
        i;
      }
    `);
  });

  it('special-cases variable for-in range loops to avoid creating arrays', () => {
    check(`
      for i in [a..b]
        i
    `, `
      for (var i = a; a < b ? i <= b : i >= b; a < b ? i++ : i--) {
        i;
      }
    `);
  });

  it('saves references to unsafe-to-repeat range bounds in variable for-in loops', () => {
    check(`
      for i in [a()..b()]
        i
    `, `
      var start = a();
      var end = b();
      for (var i = start; start < end ? i <= end : i >= end; start < end ? i++ : i--) {
        i;
      }
    `);
  });

  it('moves the body of a one-line for-of loop to the next line', () => {
    check(`
      k for k of o
    `, `
      for (var k in o) {
        k;
      }
    `);
  });

  it('moves the body of a one-line for-in loop to the next line', () => {
    check(`
      e for e in l
    `, `
      for (var i = 0, e; i < l.length; i++) {
        e = l[i];
        e;
      }
    `);
  });

  it('saves the list of results when for-of loops are used in an expression context', () => {
    check(`
      a(k for k of o)
    `, `
      a((() => {
        var result = [];
        for (var k in o) {
          result.push(k);
        }
        return result;
      })());
    `);
  });

  it('saves the list of results when for-in loops are used in an expression context', () => {
    check(`
      a(e for e in l)
    `, `
      a((() => {
        var result = [];
        for (var i = 0, e; i < l.length; i++) {
          e = l[i];
          result.push(e);
        }
        return result;
      })());
    `);
  });

  it('saves the list of results when for-in loops are used as an implicit return', () => {
    check(`
      ->
        a for a in b
    `, `
      (function() {
        return (() => {
          var result = [];
          for (var i = 0, a; i < b.length; i++) {
            a = b[i];
            result.push(a);
          }
          return result;
        })();
      });
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
      (function() {
        return (() => {
          var result = [];
          for (var i = 0, a; i < b.length; i++) {
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
      for (var i = 0, a; i < b.length; i++) {
        a = b[i];
        for (var j = 0, c; j < d.length; j++) {
          c = d[j];
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
      for (var key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          console.log(key);
        }
      }
    `);
  });

  it('handles `for own` with an unsafe-to-repeat iterable', () => {
    check(`
      for own key of getList()
        console.log key
    `, `
      var iterable;
      for (var key in (iterable = getList())) {
        if (Object.prototype.hasOwnProperty.call(iterable, key)) {
          console.log(key);
        }
      }
    `);
  });

  it('handles `for own` with both key and value', () => {
    check(`
      for own key, value of list
        console.log key, value
    `, `
      for (var key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          var value = list[key];
          console.log(key, value);
        }
      }
    `);
  });

  it('handles `for own` with a filter', () => {
    check(`
      for own key of list when key[0] is '_'
        console.log key
    `, `
      for (var key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          if (key[0] === '_') {
            console.log(key);
          }
        }
      }
    `);
  });
});
