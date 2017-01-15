import check from './support/check';
import validate from './support/validate';

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

    it('works with member access as the function', () => {
      check(`
        a.b?()
      `, `
        __guardMethod__(a, 'b', o => o.b());
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `);
    });

    it('works with dynamic member access as the function', () => {
      check(`
        a[b]?()
      `, `
        __guardMethod__(a, b, (o, m) => o[m]());
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `);
    });

    it('works with dynamic member access whose key is unsafe to repeat as the function', () => {
      check(`
        a[b()]?()
      `, `
        __guardMethod__(a, b(), (o, m) => o[m]());
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
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

    it('properly sets this in soaked method calls', () => {
      validate(`
        o = false
        a = {
          b: ->
            if a == this
              o = true
        }
        a.b?()
      `, true);
    });

    it('properly sets `this` in shorthand-`this` soaked method calls', () => {
      validate(`
        o = false
        a = {
          b: ->
            @c?()
          c: ->
            if a == this
              o = true
        }
        a.b()
      `, true);
    });

    it('properly sets `this` in soaked dynamic method calls', () => {
      validate(`
        o = false
        a = {
          b: ->
            if a == this
              o = true
        }
        a['b']?()
      `, true);
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

    it('keeps prefix ++ within soak expressions', () => {
      check(`
        ++a?.b
      `, `
        __guard__(a, x => ++x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('keeps prefix ++ within soaked dynamic accesses', () => {
      check(`
        ++a?[b]
      `, `
        __guard__(a, x => ++x[b]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('keeps prefix ++ within soaked dynamic accesses where the LHS is surrounded by parens', () => {
      check(`
        ++(a)?[b]
      `, `
        __guard__((a), x => ++x[b]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('keeps prefix ++ within soaked function calls', () => {
      check(`
        ++a?(b).c
      `, `
        __guardFunc__(a, f => ++f(b).c);
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `);
    });

    it('keeps prefix ++ within soaked method calls', () => {
      check(`
        ++a.b?(c).d
      `, `
        __guardMethod__(a, 'b', o => ++o.b(c).d);
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `);
    });

    it('keeps prefix ++ within soaked dynamic method calls', () => {
      check(`
        ++a[b]?(c).d
      `, `
        __guardMethod__(a, b, (o, m) => ++o[m](c).d);
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `);
    });

    it('keeps prefix -- within soak expressions', () => {
      check(`
        --a?.b
      `, `
        __guard__(a, x => --x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('keeps delete within soak expressions', () => {
      check(`
        delete a?.b
      `, `
        __guard__(a, x => delete x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `);
    });

    it('handles soaked prototype access', () => {
      check(`
        a?::b
      `, `
        __guard__(a, x => x.prototype.b);
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

  it('handles a soaked method call on a soaked member access', () => {
    check(`
      a?.b?()
    `, `
      __guardMethod__(a, 'b', o => o.b());
      function __guardMethod__(obj, methodName, transform) {
        if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
          return transform(obj, methodName);
        } else {
          return undefined;
        }
      }
    `);
  });

  it('handles a soaked method call on a soaked dynamic member access', () => {
    check(`
      a?[b]?()
    `, `
      __guardMethod__(a, b, (o, m) => o[m]());
      function __guardMethod__(obj, methodName, transform) {
        if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
          return transform(obj, methodName);
        } else {
          return undefined;
        }
      }
    `);
  });

  it('handles a combination of soaked function calls and soaked member accesses', () => {
    check(`
      a?(1)?.b?()?[c].d?()?.e = 1
    `, `
      __guard__(__guardMethod__(__guard__(__guardMethod__(__guardFunc__(a, f => f(1)), 'b', o1 => o1.b()), x1 => x1[c]), 'd', o => o.d()), x => x.e = 1);
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
      function __guardMethod__(obj, methodName, transform) {
        if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
          return transform(obj, methodName);
        } else {
          return undefined;
        }
      }
      function __guardFunc__(func, transform) {
        return typeof func === 'function' ? transform(func) : undefined;
      }
    `);
  });

  it('properly sets patching bounds for soaked function applications', () => {
    check(`
      f?(a, 
        b: c
        d: e)
    `, `
      __guardFunc__(f, f => f(a, { 
        b: c,
        d: e
      }));
      function __guardFunc__(func, transform) {
        return typeof func === 'function' ? transform(func) : undefined;
      }
    `);
  });

  it('properly transforms an `in` operator with a soak expression on the left', () => {
    check(`
      a?.b in c
    `, `
      Array.from(c).includes(__guard__(a, x => x.b));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
  });

  it('properly transforms an `in` operator with a soak expression on the right', () => {
    check(`
      a in b?.c
    `, `
      Array.from(__guard__(b, x => x.c)).includes(a);
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
  });

  it('handles a soaked access used with an existence operator', () => {
    check(`
      a = b()?.c ? d
    `, `
      let left;
      let a = (left = __guard__(b(), x => x.c)) != null ? left : d;
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
  });

  it('handles a soaked dynamic access used with an existence operator', () => {
    check(`
      a = b()?[c()] ? d
    `, `
      let left;
      let a = (left = __guard__(b(), x => x[c()])) != null ? left : d;
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
  });

  it('handles a soaked access used with an existence assignment operator', () => {
    check(`
      a()?.b ?= c
    `, `
      let base;
      __guard__((base = a()), x => x.b != null ? base.b : (base.b = c));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
  });

  it('handles a soaked dynamic access used with an existence assignment operator', () => {
    check(`
      a()?[b()] ?= d
    `, `
      let base;
      let name;
      __guard__((base = a()), x => x[name = b()] != null ? base[name] : (base[name] = d));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
  });

  it('handles a soaked access used with a logical assignment operator', () => {
    check(`
      a()?.b and= c
    `, `
      let base;
      __guard__((base = a()), x => x.b && (base.b = c));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
  });

  it('handles a soaked dynamic access used with a logical assignment operator', () => {
    check(`
      a()?[b()] and= d
    `, `
      let base;
      let name;
      __guard__((base = a()), x => x[name = b()] && (base[name] = d));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
  });

    it('handles a soaked access in an existantial case in a for target', () => {
        check(`
      i + j for j, i in foo?.bar ? []
    `, `
      let iterable = __guard__(foo, x => x.bar) != null ? __guard__(foo, x => x.bar) : [];
      for (let i = 0; i < iterable.length; i++) { let j = iterable[i]; i + j; }
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `);
    });
});
