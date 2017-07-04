import check from './support/check';

describe('default params', () => {
  it('keeps default value with loose mode enabled', () => {
    check(`(a=2) ->`, `(function(a=2) {});`, {
      options: {
        looseDefaultParams: true,
      }
    });
  });

  it('ensures transforms happen on the default value in loose mode', () => {
    check(`(a=b c) ->`, `(function(a=b(c)) {});`, {
      options: {
        looseDefaultParams: true,
      }
    });
  });

  it('ensures @foo is transformed correctly in loose mode', () => {
    check(`(a=@b) ->`, `(function(a=this.b) {});`, {
      options: {
        looseDefaultParams: true,
      }
    });
  });

  it('patches value as an expression in loose mode', () => {
    check(`(a=b: c) ->`, `(function(a={b: c}) {});`, {
      options: {
        looseDefaultParams: true,
      }
    });
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
      const a = 3;
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
        const {a} = param;
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
          const {
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
      const a = function(param) {
        if (param == null) { param = {}; }
        const {
          b,
        } = param;
        return c;
      };
    `);
  });

  it('handles a function as a default value (#729)', () => {
    check(`
      filter = (items, predicate = (-> true)) -> items.filter(predicate)
    `, `
      const filter = function(items, predicate) { if (predicate == null) { predicate = () => true; } return items.filter(predicate); };
    `);
  });

  it('does not defensively convert default params that default to null', () => {
    check(`
      (a = null) ->
        console.log a
    `, `
      (a = null) => console.log(a);
    `);
  });
});
