import check from './support/check';

describe('try', () => {
  it('handles multi-line try/catch with catch assignee', () => {
    check(`
      try
        a()
      catch ex
        b()
    `, `
      try {
        a();
      } catch (ex) {
        b();
      }
    `);
  });

  it('handles indented multi-line try/catch with catch assignee', () => {
    check(`
      ->
        try
          a()
        catch ex
          b()
    `, `
      (function() {
        try {
          return a();
        } catch (ex) {
          return b();
        }
      });
    `);
  });

  it('handles multi-line try/catch without catch assignee', () => {
    check(`
      try
        a()
      catch
        b()
    `, `
      try {
        a();
      } catch (error) {
        b();
      }
    `);
  });

  it('handles multi-line try without catch clause without finally clause', () => {
    check(`
      try
        a()
    `, `
      try {
        a();
      } catch (error) {}
    `);
  });

  it('handles multi-line indented try without catch clause without finally clause', () => {
    check(`
      ->
        try
          a()
    `, `
      (function() {
        try {
          return a();
        } catch (error) {}
      });
    `);
  });

  it('handles multi-line try without catch clause with finally clause', () => {
    check(`
      try
        a()
      finally
        b()
    `, `
      try {
        a();
      } finally {
        b();
      }
    `);
  });

  it('works with statements immediately following a catch-less try block', () => {
    check(`
      try
        a
      b
    `, `
      try {
        a;
      } catch (error) {}
      b;
    `);
  });

  it('works with single-line try', () => {
    check(`
      try a
    `, `
      try { a; } catch (error) {}
    `);
  });

  it('works with single-line try and single-line catch with `then`', () => {
    check(`
      try a catch err then b
    `, `
      try { a; } catch (err) { b; }
    `);
  });

  it('works with single-line try used as an expression', () => {
    check(`
      a = try b()
    `, `
      let a = (() => { try { return b(); } catch (error) {} })();
    `);
  });

  it('ensures the name of the catch assignee is unique', () => {
    check(`
      error = null
      try
        foo()
    `, `
      let error = null;
      try {
        foo();
      } catch (error1) {}
    `);
  });

  it('handles try with an empty catch block', () => {
    check(`
      try
        something()
      catch
    `, `
      try {
        something();
      } catch (error) {}
    `);
  });

  it('handles try with an empty finally block', () => {
    check(`
      try
        something()
      finally
    `, `
      try {
        something();
      } finally {}
    `);
  });

  it('handles try with an empty catch and finally block', () => {
    check(`
      try
        something()
      catch
      finally
    `, `
      try {
        something();
      } catch (error) {}
      finally {}
    `);
  });

  it('handles try with an empty catch block with a catch variable', () => {
    check(`
      try
        something()
      catch err
    `, `
      try {
        something();
      } catch (err) {}
    `);
  });

  it('handles try with an empty catch block with a catch variable and an empty finally block', () => {
    check(`
      try
        something()
      catch err
      finally
    `, `
      try {
        something();
      } catch (err) {}
      finally {}
    `);
  });

  it('handles try within a function with all blocks empty', () => {
    check(`
      ->
        try
        catch err
        finally
    `, `
      (function() {
        try {}
        catch (err) {}
        finally {}
      });
    `);
  });

  it('handles try by itself', () => {
    check(`
      try
    `, `
      try {} catch (error) {}
    `);
  });

  it('handles try with a non-empty catch', () => {
    check(`
      try
      catch
        a
    `, `
      try {}
      catch (error) {
        a;
      }
    `);
  });

  it('handles empty try, catch, and finally all on one line', () => {
    check(`
      try catch err then finally
    `, `
      try {} catch (err) {} finally {}
    `);
  });

  it('handles a try expression wrapped in parens', () => {
    check(`
      x = (try a catch b then c)
    `, `
      let x = ((() => { try { return a; } catch (b) { return c; } })());
    `);
  });

  it('handles a try expression as an unless condition', () => {
    check(`
      unless (try a catch b then c) then d
    `, `
      if (!(() => { try { return a; } catch (b) { return c; } })()) { d; }
    `);
  });

  it('handles an IIFE-style try statement with a yield', () => {
    check(`
      () ->
        x = try
          yield 1
        catch
          yield 2
    `, `
      (function*() {
        let x;
        return x = yield* (function*() { try {
          return yield 1;
        } catch (error) {
          return yield 2;
        } }).call(this);
      });
    `);
  });

  it('treats the exception assignee as a normal variable in its outer scope if necessary', () => {
    check(`
      try
        a
      catch e
        b
      console.log e
    `, `
      let e;
      try {
        a;
      } catch (error) {
        e = error;
        b;
      }
      console.log(e);
    `);
  });

  it('handles complex destructuring within a catch', () => {
    check(`
      try
        a
      catch {b: [c, ..., d]}
        e
    `, `
      try {
        a;
      } catch (error) {
        let array = error.b, c = array[0], d = array[array.length - 1];
        e;
      }
    `);
  });

  it('properly picks a distinct variable name when choosing a catch assignee', () => {
    check(`
      try
        a
      catch {error}
        b
    `, `
      try {
        a;
      } catch (error1) {
        let {error} = error1;
        b;
      }
    `);
  });

  it('handles a complex catch assignee with no catch body', () => {
    check(`
      try
        a
      catch error
      console.log error
    `, `
      let error;
      try {
        a;
      } catch (error1) { error = error1; }
      console.log(error);
    `);
  });

  it('properly handles an expression-style try/catch in an implicit return context', () => {
    check(`
      ->
        x = (try a)
    `, `
      (function() {
        let x;
        return x = ((() => { try { return a; } catch (error) {} })());
      });
    `);
  });
});
