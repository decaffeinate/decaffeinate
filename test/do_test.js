import check from './support/check';

describe('do', () => {
  it('creates an IIFE returning the last value', () => {
    check(`do -> 1`, `(function() { return 1; })();`);
  });

  it('creates an IIFE with bound functions', () => {
    check(`do => 1`, `(() => 1)();`);
  });

  it('creates an IIFE with shadowed arguments', () => {
    check(`do (i) -> i`, `(function(i) { return i; })(i);`);
  });

  it('creates an IIFE with explicit bindings', () => {
    check(`do (i=1) -> i`, `(function(i) { return i; })(1);`);
  });

  it('creates an IIFE with object destructuring', () => {
    check(`do ({i}) -> i`, `(function({i}) { return i; })({i});`);
  });

  it('creates an IIFE with array destructuring', () => {
    check(`do ([a]) -> a`, `(function([a]) { return a; })([a]);`);
  });

  it('create a multi-line IIFE', () => {
    check(`
      do (i, n=0) ->
        result = i + n
        result
    `, `
      (function(i, n) {
        var result = i + n;
        return result;
      })(i, 0);
    `);
  });

  it('creates an IIFE for `do` used in an expression context', () => {
    check(`a(do -> 1)`, `a((function() { return 1; })());`);
  });
});
