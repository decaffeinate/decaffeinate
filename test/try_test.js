import check from './support/check';

describe.skip('try', () => {
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
      } catch (error) {
      }
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
        } catch (error) {
        }
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
      } catch (error) {
      }
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

  it('works with single-line try used as an expression', () => {
    check(`
      a = try b()
    `, `
      var a = (() => {
        try { return b(); } catch (error) {}
      })();
    `);
  });

  it('ensures the name of the catch assignee is unique', () => {
    check(`
      error = null
      try
        foo()
    `, `
      var error = null;
      try {
        foo();
      } catch (error1) {
      }
    `);
  });
});
