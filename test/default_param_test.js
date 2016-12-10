import check from './support/check.js';

describe('default params', () => {
  it('keeps default value with loose mode enabled', () => {
    check(`(a=2) ->`, `(function(a=2) {});`, { looseDefaultParams: true });
  });

  it('ensures transforms happen on the default value in loose mode', () => {
    check(`(a=b c) ->`, `(function(a=b(c)) {});`, { looseDefaultParams: true });
  });

  it('ensures @foo is transformed correctly in loose mode', () => {
    check(`(a=@b) ->`, `(function(a=this.b) {});`, { looseDefaultParams: true });
  });

  it('patches value as an expression in loose mode', () => {
    check(`(a=b: c) ->`, `(function(a={b: c}) {});`, { looseDefaultParams: true });
  });

  it('changes default params to conditional assignments by default', () => {
    check(`
      (a=b()) ->
        return
    `, `
      (function(a) {
        if (a == null) { a = b(); }
      });
    `);
  });

  it('ensures transforms happen on the default value', () => {
    check(`
      (a=b c) ->
    `, `
      (function(a) {
        if (a == null) { a = b(c); }
      });
    `);
  });

  it('handles a `this` assignment and a default param assignment in the same param', () => {
    check(`
      a = 3
      (@a=b()) ->
        console.log a
        return
    `, `
      let a = 3;
      (function(a1) {
        if (a1 == null) { a1 = b(); }
        this.a = a1;
        console.log(a);
      });
    `);
  });

  it('handles a destructure with a default param', () => {
    check(`
      ({a}={}) ->
        return
    `, `
      (function(param) {
        if (param == null) { param = {}; }
        let {a} = param;
      });
    `);
  });

  it('handles a multiline destructure with a default param with the expression indented', () => {
    check(`
      ->
        a = ({
          b,
        } = {}) ->
          return c
    `, `
      (function() {
        let a;
        return a = function(param) {
          if (param == null) { param = {}; }
          let {
            b,
          } = param;
          return c;
        };
      });
    `);
  });

  it('handles a multiline destructure with a default param', () => {
    check(`
      a = ({
        b,
      } = {}) ->
        return c
    `, `
      let a = function(param) {
        if (param == null) { param = {}; }
        let {
          b,
        } = param;
        return c;
      };
    `);
  });
});
