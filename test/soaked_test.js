import check from './support/check.js';
import validate from './support/validate.js';

describe('soaked expressions', () => {
  describe('function application', () => {
    it('works with a basic function', () => {
      check(`
        a?()
      `, `
        __guardFunc__(a, f => f());
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `);
    });

    it('works with a function that is not safe to repeat', () => {
      check(`
        a()?()
      `, `
        __guardFunc__(a(), f => f());
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `);
    });

    it('works in an expression context', () => {
      check(`
        a(b()?())
      `, `
        a(__guardFunc__(b(), f => f()));
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `);
    });

    it('preserves arguments', () => {
        check(`
        a?(1, 2, 3)
      `, `
        __guardFunc__(a, f => f(1, 2, 3));
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `);
    });

    it('handles nested soaked function calls', () => {
      check(`
        a?(1)?(2)
      `, `
        __guardFunc__(__guardFunc__(a, f1 => f1(1)), f => f(2));
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `);
    });

    it('works with dynamic member access as the function', () => {
      check(`
        a[b]?()
      `, `
        __guardFunc__(a[b], f => f());
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `);
    });

    it('works with dynamic member access whose key is unsafe to repeat as the function', () => {
      check(`
        a[b()]?()
      `, `
        __guardFunc__(a[b()], f => f());
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `);
    });

    it('evaluates soaked function calls', () => {
      validate(`
        f = -> 3
        o = f?()
      `, 3);
    });

    it('skips soaked function invocations on non-functions', () => {
      validate(`
        f = 3
        o = f?()
      `, undefined);
    });
  });

  describe('soaked member access', () => {
    it('handles soaked member access assignment', () => {
      check(`
        canvasContext?.font = $('body').css('font')
      `, `
        __guard__(canvasContext, x => x.font = $('body').css('font'));
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles soaked member access with conflicting variable names', () => {
      check(`
        x = 5
        a?.b(x)
      `, `
        let x = 5;
        __guard__(a, x1 => x1.b(x));
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles soaked member access with assignment within an expression', () => {
      check(`
        a(b?.c = d)
      `, `
        a(__guard__(b, x => x.c = d));
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles soaked member access with a function call', () => {
      check(`
        a?.b()
      `, `
        __guard__(a, x => x.b());
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles soaked member access on the result of a function call', () => {
      check(`
        a.b()?.c
      `, `
        __guard__(a.b(), x => x.c);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('allows soaked member access to be used in an expression', () => {
      check(`
        a(b?.c)
      `, `
        a(__guard__(b, x => x.c));
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles dynamic member access', () => {
      check(`
        a?[b]()
      `, `
        __guard__(a, x => x[b]());
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles soaked dynamic member access followed by normal dynamic member access', () => {
      check(`
        a?[b].c[d]
      `, `
        __guard__(a, x => x[b].c[d]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles nested soaked dynamic member access', () => {
      check(`
        a?[b].c?[d]
      `, `
        __guard__(__guard__(a, x1 => x1[b].c), x => x[d]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles soaked member access within a condition', () => {
      check(`
        if a?.b then c
      `, `
        if (__guard__(a, x => x.b)) { c; }
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles nested soaked member access', () => {
      check(`
        a?.b?.c = 0;
      `, `
        __guard__(__guard__(a, x1 => x1.b), x => x.c = 0);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles explicit parens around soaks', () => {
      check(`
        (a?.b).c
      `, `
        (__guard__(a, x => x.b)).c;
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('keeps postfix ++ within soak expressions', () => {
      check(`
        a?.b++
      `, `
        __guard__(a, x => x.b++);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('keeps postfix -- within soak expressions', () => {
      check(`
        a?.b--
      `, `
        __guard__(a, x => x.b--);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it.skip('keeps prefix ++ within soak expressions', () => {
      check(`
        ++a?.b
      `, `
        __guard__(a, x => ++x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it.skip('keeps prefix -- within soak expressions', () => {
      check(`
        --a?.b
      `, `
        __guard__(a, x => --x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it.skip('keeps delete within soak expressions', () => {
      check(`
        delete a?.b
      `, `
        __guard__(a, x => delete x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('correctly handles normal soaked access', () => {
      validate(`
        a = {b: 5}
        o = a?.b
      `, 5);
    });

    it('correctly handles missing soaked access', () => {
      validate(`
        a = {b: null}
        o = a.b?.c
      `, undefined);
    });

    it('correctly handles dynamic soaked access', () => {
      validate(`
        a = {b: 5}
        o = a?['b']
      `, 5);
    });

    it('correctly handles missing dynamic soaked access', () => {
      validate(`
        a = {b: null}
        o = a.b?['c']
      `, undefined);
    });

    it('stops evaluating the expression when hitting a soak failure', () => {
        validate(`
        a = {b: 5}
        o = a.d?.e.f()
      `, undefined);
    });

    it('skips assignment when a soak fails', () => {
      validate(`
        x = 1
        y = null
        z = {}
        y?.a = x++
        z?.a = x++
        o = x
      `, 2);
    });
  });
  
  it('handles a combination of soaked function calls and soaked member accesses', () => {
    check(`
      a(1)?.b?()?[c]?.d = 1
    `, `
      __guard__(__guard__(__guardFunc__(__guard__(a(1), x2 => x2.b), f => f()), x1 => x1[c]), x => x.d = 1);
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
      function __guardFunc__(func, transform) {
        return typeof func === 'function' ? transform(func) : undefined;
      }
    `);
  });
});
