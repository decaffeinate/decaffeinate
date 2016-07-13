import check from './support/check.js';

describe('expansion', () => {
  it('allows getting the last elements of an array', () => {
    check(`
      [..., a, b] = arr
    `, `
      let a = arr[arr.length - 2], b = arr[arr.length - 1];
    `);
  });

  it.skip('allows getting the last elements of a parameter list', () => {
    check(`
      (..., a, b) ->
    `, `
      (function() {
        let a = arguments[arguments.length - 2], b = arguments[arguments.length - 1];
      });
    `);
  });

  it('is removed at the end of an array', () => {
    check(`
      [a, b, ...] = arr
    `, `
      let [a, b] = arr;
    `);
  });

  it.skip('is removed at the end of a parameter list', () => {
    check(`
      (a, b, ...) ->
    `, `
      (function(a, b) {});
    `);
  });

  it('allows getting the first and last elements of an array', () => {
    check(`
      [a, b, ..., c, d] = arr
    `, `
      let a = arr[0], b = arr[1], c = arr[arr.length - 2], d = arr[arr.length - 1];
    `);
  });

  it.skip('allows getting the first and last elements of a parameter list', () => {
    check(`
      (a, b, ..., c, d) ->
    `, `
      (function(a, b, ...rest) {
        let c = rest[rest.length - 2], d = rest[rest.length - 1];
      });
    `);
  });

  it.skip('allows getting the first and last elements of a parameter list in a bound function', () => {
    check(`
      (a, b, ..., c, d) =>
    `, `
      ((a, b, ...rest) => {
        let c = rest[rest.length - 2], d = rest[rest.length - 1];
      });
    `);
  });

  it('allows getting elements from an unsafe-to-repeat list', () => {
    check(`
      [a, b, ..., c, d] = getArray()
    `, `
      let array = getArray(), a = array[0], b = array[1], c = array[array.length - 2], d = array[array.length - 1];
    `);
  });

  it('handles expansions over destructures', () => {
    check(`
      [..., {a, b}] = arr
    `, `
      let {a, b} = arr[arr.length - 1];
    `);
  });
});
