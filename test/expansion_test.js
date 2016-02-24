import check from './support/check.js';

describe.skip('expansion', () => {
  it('allows getting the last elements of an array', () => {
    check(`
      [..., a, b] = arr
    `, `
      var a = arr[arr.length - 2], b = arr[arr.length - 1];
    `);
  });

  it('allows getting the last elements of a parameter list', () => {
    check(`
      (..., a, b) ->
    `, `
      (function() {
        var a = arguments[arguments.length - 2], b = arguments[arguments.length - 1];
      });
    `);
  });

  it('is removed at the end of an array', () => {
    check(`
      [a, b, ...] = arr
    `, `
      var [a, b] = arr;
    `);
  });

  it('is removed at the end of a parameter list', () => {
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
      var a = arr[0], b = arr[1], c = arr[arr.length - 2], d = arr[arr.length - 1];
    `);
  });

  it('allows getting the first and last elements of a parameter list', () => {
    check(`
      (a, b, ..., c, d) ->
    `, `
      (function() {
        var a = arguments[0], b = arguments[1], c = arguments[arguments.length - 2], d = arguments[arguments.length - 1];
      });
    `);
  });

  it('allows getting elements from an unsafe-to-repeat list', () => {
    check(`
      [a, b, ..., c, d] = getArray()
    `, `
      var array = getArray(), a = array[0], b = array[1], c = array[array.length - 2], d = array[array.length - 1];
    `);
  });
});
