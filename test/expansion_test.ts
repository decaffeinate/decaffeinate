import check, { checkCS1, checkCS2 } from './support/check';
import validate, { validateCS1 } from './support/validate';

describe('expansion', () => {
  it('allows getting the last elements of an array', () => {
    check(
      `
      [..., a, b] = arr
    `,
      `
      const a = arr[arr.length - 2], b = arr[arr.length - 1];
    `
    );
  });

  it('allows getting the first part and last elements of an array', () => {
    check(
      `
      [a..., b, c] = arr
    `,
      `
      const adjustedLength = Math.max(arr.length, 2),
        a = arr.slice(0, adjustedLength - 2),
        b = arr[adjustedLength - 2],
        c = arr[adjustedLength - 1];
    `
    );
  });

  it('allows a rest destructure in the middle of an array', () => {
    check(
      `
      [a, b..., c] = arr
    `,
      `
      const a = arr[0],
        adjustedLength = Math.max(arr.length, 2),
        b = arr.slice(1, adjustedLength - 1),
        c = arr[adjustedLength - 1];
    `
    );
  });

  it('does not generate special assignment code when the rest is at the end', () => {
    checkCS1(
      `
      [a, b, c...] = arr
    `,
      `
      const [a, b, ...c] = Array.from(arr);
    `
    );
    checkCS2(
      `
      [a, b, c...] = arr
    `,
      `
      const [a, b, ...c] = arr;
    `
    );
  });

  it('allows getting the last elements of a parameter list', () => {
    checkCS1(
      `
      (..., a, b) ->
    `,
      `
      (function(...args) {
        const a = args[args.length - 2], b = args[args.length - 1];
      });
    `
    );
  });

  it('allows default params for expansion params', () => {
    checkCS1(
      `
      (..., a = 1) ->
    `,
      `
      (function(...args) {
        const val = args[args.length - 1], a = val != null ? val : 1;
      });
    `
    );
  });

  it('allows this assignment for expansion params', () => {
    checkCS1(
      `
      (..., @a) ->
    `,
      `
      (function(...args) {
        this.a = args[args.length - 1];
      });
    `
    );
  });

  it('does not create name conflicts in the expansion param case', () => {
    checkCS1(
      `
      a = 1
      (..., @a) ->
        console.log a
        return
    `,
      `
      const a = 1;
      (function(...args) {
        this.a = args[args.length - 1];
        console.log(a);
      });
    `
    );
  });

  it('allows getting the initial array and last elements of a parameter list', () => {
    check(
      `
      (a..., b, c) ->
    `,
      `
      (function(...args) {
        const adjustedLength = Math.max(args.length, 2),
          a = args.slice(0, adjustedLength - 2),
          b = args[adjustedLength - 2],
          c = args[adjustedLength - 1];
      });
    `
    );
  });

  it('is removed at the end of an array', () => {
    checkCS1(
      `
      [a, b, ...] = arr
    `,
      `
      const [a, b] = Array.from(arr);
    `
    );
    checkCS2(
      `
      [a, b, ...] = arr
    `,
      `
      const [a, b] = arr;
    `
    );
  });

  it('is removed at the end of a parameter list', () => {
    check(
      `
      (a, b, ...) ->
    `,
      `
      (function(a, b) {});
    `
    );
  });

  it('converts rest params at the end to JS rest params', () => {
    check(
      `
      (a, b, c...) ->
    `,
      `
      (function(a, b, ...c) {});
    `
    );
  });

  it('allows getting the first and last elements of an array', () => {
    checkCS1(
      `
      [a, b, ..., c, d] = arr
    `,
      `
      const a = arr[0], b = arr[1], c = arr[arr.length - 2], d = arr[arr.length - 1];
    `
    );
  });

  it('allows getting the first and last elements of a parameter list', () => {
    checkCS1(
      `
      (a, b, ..., c, d) ->
    `,
      `
      (function(...args) {
        const a = args[0], b = args[1], c = args[args.length - 2], d = args[args.length - 1];
      });
    `
    );
  });

  it('allows interior rest params, using the "rest" name', () => {
    check(
      `
      (a, b, c..., d, e) ->
    `,
      `
      (function(a, b, ...rest) {
        const adjustedLength = Math.max(rest.length, 2),
          c = rest.slice(0, adjustedLength - 2),
          d = rest[adjustedLength - 2],
          e = rest[adjustedLength - 1];
      });
    `
    );
  });

  it('allows getting the first and last elements of a parameter list in a bound function', () => {
    checkCS1(
      `
      (a, b, ..., c, d) =>
    `,
      `
      (...args) => {
        const a = args[0], b = args[1], c = args[args.length - 2], d = args[args.length - 1];
      };
    `
    );
  });

  it('handles an expansion node in a parameter array destructure', () => {
    checkCS1(
      `
      (a, [..., b], c) ->
        d
    `,
      `
      (function(a, ...rest) {
        const array = rest[0], b = array[array.length - 1], c = rest[1];
        return d;
      });
    `
    );
  });

  it('handles a complex single argument', () => {
    checkCS1(
      `
      fn = ([a,b]) -> {a:a,b:b}
    `,
      `
      const fn = function(...args) { const [a,b] = Array.from(args[0]); return {a,b}; };
    `
    );
    checkCS2(
      `
      fn = ([a,b]) -> {a:a,b:b}
    `,
      `
      const fn = ([a,b]) => ({a,b});
    `
    );
  });

  it('handles a complex parameter list with varying indentation', () => {
    checkCS1(
      `
      f = (a, b, ..., {
        c,
        d,
        e,
      }) ->
        f
    `,
      `
      var f = function(...args) {
        const a = args[0], b = args[1], {
          c,
          d,
          e,
        } = args[args.length - 1];
        return f;
      };
    `
    );
  });

  it('allows getting elements from an unsafe-to-repeat list', () => {
    checkCS1(
      `
      [a, b, ..., c, d] = getArray()
    `,
      `
      const array = getArray(),
        a = array[0],
        b = array[1],
        c = array[array.length - 2],
        d = array[array.length - 1];
    `
    );
  });

  it('allows getting elements and an intermediate rest from an unsafe-to-repeat list', () => {
    check(
      `
      [a, b, c..., d, e] = getArray()
    `,
      `
      const array = getArray(),
        a = array[0],
        b = array[1],
        adjustedLength = Math.max(array.length, 4),
        c = array.slice(2, adjustedLength - 2),
        d = array[adjustedLength - 2],
        e = array[adjustedLength - 1];
    `
    );
  });

  it('handles expansions and object destructures', () => {
    checkCS1(
      `
      [..., {a, b}] = arr
    `,
      `
      const {a, b} = arr[arr.length - 1];
    `
    );
  });

  it('handles expansions and object destructures with renaming', () => {
    checkCS1(
      `
      [..., {a: b, c: d}] = arr
    `,
      `
      const {a: b, c: d} = arr[arr.length - 1];
    `
    );
  });

  it('handles nested expansions', () => {
    checkCS1(
      `
      [..., [..., a]] = arr
    `,
      `
      const array = arr[arr.length - 1], a = array[array.length - 1];
    `
    );
  });

  it('handles a deeply-nested non-repeatable expression', () => {
    checkCS1(
      `
      [..., [..., a[b()]]] = arr
    `,
      `
      let array;
      array = arr[arr.length - 1], a[b()] = array[array.length - 1];
    `
    );
  });

  it('handles an array destructure within a rest destructure', () => {
    checkCS1(
      `
      [a, [b]..., c] = arr
    `,
      `
      const a = arr[0],
        adjustedLength = Math.max(arr.length, 2),
        [b] = Array.from(arr.slice(1, adjustedLength - 1)),
        c = arr[adjustedLength - 1];
    `
    );
  });

  it('handles an expansion and a default param', () => {
    checkCS1(
      `
      [..., a = 1] = arr
    `,
      `
      const val = arr[arr.length - 1], a = val != null ? val : 1;
    `
    );
  });

  it('handles a this-assign with default in an object destructure', () => {
    checkCS1(
      `
      {@a = b} = c
    `,
      `
      let val;
      val = c.a, this.a = val != null ? val : b;
    `
    );
    checkCS2(
      `
      {@a = b} = c
    `,
      `
      ({a: this.a = b} = c);
    `
    );
  });

  it('handles a default destructure assign', () => {
    checkCS1(
      `
      {a = 1} = {}
    `,
      `
      const obj = {}, val = obj.a, a = val != null ? val : 1;
    `
    );
    checkCS2(
      `
      {a = 1} = {}
    `,
      `
      const {a = 1} = {};
    `
    );
  });

  it('handles a string key with a default assignment', () => {
    checkCS1(
      `
      {"#{a b}": c = d} = e
    `,
      `
      const val = e[\`\${a(b)}\`], c = val != null ? val : d;
    `
    );
    checkCS2(
      `
      {"#{a b}": c = d} = e
    `,
      `
      const {[a(b)]: c = d} = e;
    `
    );
  });

  it('has the right semantics for nested rest destructures', () => {
    // CS2 appears to be buggy in this case, at least 2.2.1 is.
    validateCS1(
      `
      arr = [1, 2, 3, 4, 5, 6]
      [a, [b, c..., d]..., e] = arr
      setResult(a + b + d + e + c.length)
    `,
      16
    );
  });

  it('properly destructures array-like objects', () => {
    validate(
      `
      arr = {length: 1, 0: 'Hello'}
      try
        [value] = arr
        setResult(value)
      catch
        setResult('Fails in CS2')
    `,
      { cs1: 'Hello', cs2: 'Fails in CS2' }
    );
  });

  it('properly destructures nested array-like objects', () => {
    validate(
      `
      arr = {length: 1, 0: 'World'}
      try
        [[value]] = [arr]
        setResult(value)
      catch
        setResult('Fails in CS2')
    `,
      { cs1: 'World', cs2: 'Fails in CS2' }
    );
  });

  it('properly destructures array-like objects with an expansion destructure', () => {
    validate(
      `
      arr = {length: 2, 0: 'Hello', 1: 'World'}
      [..., secondWord] = arr
      setResult(secondWord)
    `,
      'World'
    );
  });

  it('allows an empty destructure', () => {
    validate(
      `
      setResult([] = 3)
    `,
      3
    );
  });

  it('does not call Array.from for an empty destructure', () => {
    check(
      `
      [] = undefined
    `,
      ''
    );
  });

  it('does not call Array.from for an empty destructure of a non-repeatable value', () => {
    check(
      `
      [] = a()
    `,
      `
      const array = a();
    `
    );
  });

  it('returns the RHS for a simple expression-style array destructure', () => {
    validate(
      `
      b = [1, 2, 3]
      c = [a] = b
      setResult(b == c)
    `,
      true
    );
  });

  it('properly returns the RHS for a complex assignment', () => {
    validate(
      `
      a = [1]
      o = [[]] = a
      setResult(o)
    `,
      [1]
    );
  });

  it('does not generate crashing code when doing a destructure on undefined', () => {
    validate(
      `
      try
        {} = undefined
        setResult(true)
      catch
        setResult('Fails in CS2')
    `,
      { cs1: true, cs2: 'Fails in CS2' }
    );
  });

  it('handles an object default within an array rest', () => {
    checkCS1(
      `
      [{a = 1}...] = b
    `,
      `
      const obj = b.slice(0, b.length - 0), val = obj.a, a = val != null ? val : 1;
    `
    );
  });

  it('handles expansion params with not enough values specified', () => {
    // https://github.com/decaffeinate/decaffeinate/issues/1283
    validateCS1(
      `
      f = (a, ..., b, c, d) ->
        return [a, b, c, d]
      setResult(f(1, 2))
    `,
      [1, undefined, 1, 2]
    );
  });

  it('handles an expansion destructure with not enough values specified', () => {
    // https://github.com/decaffeinate/decaffeinate/issues/1283
    validateCS1(
      `
      [a, ..., b, c, d] = [1, 2]
      setResult([a, b, c, d])
    `,
      [1, undefined, 1, 2]
    );
  });

  it('handles rest params with not enough values specified', () => {
    validate(
      `
      f = (a, b..., c, d) ->
        return [a, b, c, d]
      setResult(f(1, 2))
    `,
      [1, [], 2, undefined]
    );
  });

  it('handles a rest destructure with not enough values specified', () => {
    validate(
      `
      [a, b..., c, d] = [1, 2]
      setResult([a, b, c, d])
    `,
      [1, [], 2, undefined]
    );
  });

  it('handles nested rest after an array expansion ', () => {
    checkCS2(
      `
      [...,{a, r..., b = c}] = arr
    `,
      `
      const obj = arr[arr.length - 1],
        { a } = obj,
        r = __objectWithoutKeys__(obj, ['a', 'b']),
        val = obj.b,
        b = val !== undefined ? val : c;
      function __objectWithoutKeys__(object, keys) {
        const result = {...object};
        for (const k of keys) {
          delete result[keys];
        }
        return result;
      }
    `
    );
  });

  it('emits JS object rest when possible ', () => {
    checkCS2(
      `
      [...,{a, r...}] = arr
    `,
      `
      const {a, ...r} = arr[arr.length - 1];
    `
    );
  });

  it('allows array elisions', () => {
    checkCS2(
      `
      [a, , b] = [1, , 3]
    `,
      `
      let a, b;
      [a, , b] = [1, , 3];
    `
    );
  });

  it('does not convert nested object rest operations to JS', () => {
    checkCS2(
      `
      {...{...a}} = b
    `,
      `
      const {...a} = __objectWithoutKeys__(b, []);
      function __objectWithoutKeys__(object, keys) {
        const result = {...object};
        for (const k of keys) {
          delete result[keys];
        }
        return result;
      }
    `
    );
  });

  it('allows array elisions in complex assignments', () => {
    checkCS2(
      `
      [a,,...,b] = arr
    `,
      `
      const a = arr[0], b = arr[arr.length - 1];
    `
    );
  });
});
