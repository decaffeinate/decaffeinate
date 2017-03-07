import check from './support/check';
import validate from './support/validate';

describe('expansion', () => {
  it('allows getting the last elements of an array', () => {
    check(`
      [..., a, b] = arr
    `, `
      let a = arr[arr.length - 2], b = arr[arr.length - 1];
    `);
  });

  it('allows getting the first part and last elements of an array', () => {
    check(`
      [a..., b, c] = arr
    `, `
      let a = arr.slice(0, arr.length - 2), b = arr[arr.length - 2], c = arr[arr.length - 1];
    `);
  });

  it('allows a rest destructure in the middle of an array', () => {
    check(`
      [a, b..., c] = arr
    `, `
      let a = arr[0], b = arr.slice(1, arr.length - 1), c = arr[arr.length - 1];
    `);
  });

  it('does not generate special assignment code when the rest is at the end', () => {
    check(`
      [a, b, c...] = arr
    `, `
      let [a, b, ...c] = Array.from(arr);
    `);
  });

  it('allows getting the last elements of a parameter list', () => {
    check(`
      (..., a, b) ->
    `, `
      (function(...args) {
        let a = args[args.length - 2], b = args[args.length - 1];
      });
    `);
  });

  it('allows default params for expansion params', () => {
    check(`
      (..., a = 1) ->
    `, `
      (function(...args) {
        let val = args[args.length - 1], a = val != null ? val : 1;
      });
    `);
  });

  it('allows this assignment for expansion params', () => {
    check(`
      (..., @a) ->
    `, `
      (function(...args) {
        this.a = args[args.length - 1];
      });
    `);
  });

  it('does not create name conflicts in the expansion param case', () => {
    check(`
      a = 1
      (..., @a) ->
        console.log a
        return
    `, `
      let a = 1;
      (function(...args) {
        this.a = args[args.length - 1];
        console.log(a);
      });
    `);
  });

  it('allows getting the initial array and last elements of a parameter list', () => {
    check(`
      (a..., b, c) ->
    `, `
      (function(...args) {
        let a = args.slice(0, args.length - 2), b = args[args.length - 2], c = args[args.length - 1];
      });
    `);
  });

  it('is removed at the end of an array', () => {
    check(`
      [a, b, ...] = arr
    `, `
      let [a, b] = Array.from(arr);
    `);
  });

  it('is removed at the end of a parameter list', () => {
    check(`
      (a, b, ...) ->
    `, `
      (function(a, b) {});
    `);
  });

  it('converts rest params at the end to JS rest params', () => {
    check(`
      (a, b, c...) ->
    `, `
      (function(a, b, ...c) {});
    `);
  });

  it('allows getting the first and last elements of an array', () => {
    check(`
      [a, b, ..., c, d] = arr
    `, `
      let a = arr[0], b = arr[1], c = arr[arr.length - 2], d = arr[arr.length - 1];
    `);
  });

  it('allows getting the first and last elements of a parameter list, using the "rest" name', () => {
    check(`
      (a, b, ..., c, d) ->
    `, `
      (function(a, b, ...rest) {
        let c = rest[rest.length - 2], d = rest[rest.length - 1];
      });
    `);
  });

  it('allows interior rest params, using the "rest" name', () => {
    check(`
      (a, b, c..., d, e) ->
    `, `
      (function(a, b, ...rest) {
        let c = rest.slice(0, rest.length - 2), d = rest[rest.length - 2], e = rest[rest.length - 1];
      });
    `);
  });

  it('allows getting the first and last elements of a parameter list in a bound function', () => {
    check(`
      (a, b, ..., c, d) =>
    `, `
      (a, b, ...rest) => {
        let c = rest[rest.length - 2], d = rest[rest.length - 1];
      };
    `);
  });

  it('handles an expansion node in a parameter array destructure', () => {
    check(`
      (a, [..., b], c) ->
        d
    `, `
      (function(a, ...rest) {
        let array = rest[0], b = array[array.length - 1], c = rest[1];
        return d;
      });
    `);
  });

  it('handles a complex single argument', () => {
    check(`
      fn = ([a,b]) -> {a:a,b:b}
    `, `
      let fn = function(...args) { let [a,b] = Array.from(args[0]); return {a,b}; };
    `);
  });

  it('handles a complex parameter list with varying indentation', () => {
    check(`
      f = (a, b, ..., {
        c,
        d,
        e,
      }) ->
        f
    `, `
      var f = function(a, b, ...rest) {
        let {
          c,
          d,
          e,
        } = rest[rest.length - 1];
        return f;
      };
    `);
  });

  it('allows getting elements from an unsafe-to-repeat list', () => {
    check(`
      [a, b, ..., c, d] = getArray()
    `, `
      let array = getArray(),
        a = array[0],
        b = array[1],
        c = array[array.length - 2],
        d = array[array.length - 1];
    `);
  });

  it('allows getting elements and an intermediate rest from an unsafe-to-repeat list', () => {
    check(`
      [a, b, c..., d, e] = getArray()
    `, `
      let array = getArray(),
        a = array[0],
        b = array[1],
        c = array.slice(2, array.length - 2),
        d = array[array.length - 2],
        e = array[array.length - 1];
    `);
  });

  it('handles expansions and object destructures', () => {
    check(`
      [..., {a, b}] = arr
    `, `
      let {a, b} = arr[arr.length - 1];
    `);
  });

  it('handles expansions and object destructures with renaming', () => {
    check(`
      [..., {a: b, c: d}] = arr
    `, `
      let {a: b, c: d} = arr[arr.length - 1];
    `);
  });

  it('handles nested expansions', () => {
    check(`
      [..., [..., a]] = arr
    `, `
      let array = arr[arr.length - 1], a = array[array.length - 1];
    `);
  });

  it('handles a deeply-nested non-repeatable expression', () => {
    check(`
      [..., [..., a[b()]]] = arr
    `, `
      let array;
      array = arr[arr.length - 1], a[b()] = array[array.length - 1];
    `);
  });

  it('handles an array destructure within a rest destructure', () => {
    check(`
      [a, [b]..., c] = arr
    `, `
      let a = arr[0], [b] = Array.from(arr.slice(1, arr.length - 1)), c = arr[arr.length - 1];
    `);
  });

  it('handles an expansion and a default param', () => {
    check(`
      [..., a = 1] = arr
    `, `
      let val = arr[arr.length - 1], a = val != null ? val : 1;
    `);
  });

  it('handles a this-assign with default in an object destructure', () => {
    check(`
      {@a = b} = c
    `, `
      let val;
      val = c.a, this.a = val != null ? val : b;
    `);
  });

  it('handles a default destructure assign', () => {
    check(`
      {a = 1} = {}
    `, `
      let obj = {}, val = obj.a, a = val != null ? val : 1;
    `);
  });

  it('handles a string key with a default assignment', () => {
    check(`
      {"#{a b}": c = d} = e
    `, `
      let val = e[\`\${a(b)}\`], c = val != null ? val : d;
    `);
  });

  it('has the right semantics for nested rest destructures', () => {
    validate(`
      arr = [1, 2, 3, 4, 5, 6]
      [a, [b, c..., d]..., e] = arr
      o = a + b + d + e + c.length
    `, 16);
  });

  it('properly destructures array-like objects', () => {
    validate(`
      arr = {length: 1, 0: 'Hello'}
      [value] = arr
      o = value
    `, 'Hello');
  });

  it('properly destructures nested array-like objects', () => {
    validate(`
      arr = {length: 1, 0: 'World'}
      [[value]] = [arr]
      o = value
    `, 'World');
  });

  it('properly destructures array-like objects with an expansion destructure', () => {
    validate(`
      arr = {length: 2, 0: 'Hello', 1: 'World'}
      [..., secondWord] = arr
      o = secondWord
    `, 'World');
  });

  it('allows an empty destructure', () => {
    validate(`
      o = ([] = 3)
    `, 3);
  });

  it('does not call Array.from for an empty destructure', () => {
    check(`
      [] = undefined
    `, '');
  });

  it('does not call Array.from for an empty destructure of a non-repeatable value', () => {
    check(`
      [] = a()
    `, `
      let array = a();
    `);
  });

  it('returns the RHS for a simple expression-style array destructure', () => {
    validate(`
      b = [1, 2, 3]
      c = [a] = b
      o = b == c
    `, true);
  });

  it('properly returns the RHS for a complex assignment', () => {
    validate(`
      a = [1]
      o = [[]] = a
    `, [1]);
  });
});
