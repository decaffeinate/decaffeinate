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
});
