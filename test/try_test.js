import check from './support/check';

describe('try', () => {
  it('handles multi-line try/catch with catch assignee', function() {
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

  it('handles indented multi-line try/catch with catch assignee', function() {
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

  it('handles multi-line try/catch without catch assignee', function() {
    check(`
      try
        a()
      catch
        b()
    `, `
      try {
        a();
      } catch (_error) {
        b();
      }
    `);
  });

  it('handles multi-line try without catch clause without finally clause', function() {
    check(`
      try
        a()
    `, `
      try {
        a();
      } catch (_error) {
      }
    `);
  });

  it('handles multi-line indented try without catch clause without finally clause', function() {
    check(`
      ->
        try
          a()
    `, `
      (function() {
        try {
          return a();
        } catch (_error) {
        }
      });
    `);
  });

  it('handles multi-line try without catch clause with finally clause', function() {
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
      } catch (_error) {
      }
      b;
    `);
  });

  it('works with single-line try', () => {
    check(`
      try a
    `, `
      try { a; } catch (_error) {}
    `);
  });
});
