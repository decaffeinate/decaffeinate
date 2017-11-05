import check from './support/check';
import validate from './support/validate';

function checkSoak(input: string, expectedOutput: string, expectedOptionalChainingOutput: string): void {
  check(input, expectedOutput);
  check(input, expectedOptionalChainingOutput, {options: {useOptionalChaining: true}});
}

// tslint:disable-next-line:no-any
function validateSoak(source: string, expectedOutput: any): void {
  validate(source, expectedOutput);
  validate(source, expectedOutput, {options: {useOptionalChaining: true}, skipNodeCheck: true});
}

describe('soaked expressions', () => {
  describe('function application', () => {
    it('works with a basic function', () => {
      checkSoak(`
        a = null
        a?()
      `, `
        const a = null;
        if (typeof a === 'function') {
          a();
        }
      `, `
        const a = null;
        a?.();
      `);
    });

    it('works with a function that is not safe to repeat', () => {
      checkSoak(`
        a()?()
      `, `
        __guardFunc__(a(), f => f());
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `, `
        a()?.();
      `);
    });

    it('works in an expression context', () => {
      checkSoak(`
        a(b()?())
      `, `
        a(__guardFunc__(b(), f => f()));
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `, `
        a(b()?.());
      `);
    });

    it('preserves arguments', () => {
        checkSoak(`
        a()?(1, 2, 3)
      `, `
        __guardFunc__(a(), f => f(1, 2, 3));
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `, `
        a()?.(1, 2, 3);
      `);
    });

    it('handles nested soaked function calls', () => {
      checkSoak(`
        a = null
        a?(1)?(2)
      `, `
        const a = null;
        __guardFunc__(typeof a === 'function' ? a(1) : undefined, f => f(2));
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `, `
        const a = null;
        a?.(1)?.(2);
      `);
    });

    it('works with repeatable member access as the function', () => {
      checkSoak(`
        a.b?()
      `, `
        if (typeof a.b === 'function') {
          a.b();
        }
      `, `
        a.b?.();
      `);
    });

    it('works with non-repeatable member access as the function', () => {
      checkSoak(`
        a().b?()
      `, `
        __guardMethod__(a(), 'b', o => o.b());
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `, `
        a().b?.();
      `);
    });

    it('works with repeatable dynamic member access as the function', () => {
      checkSoak(`
        a[b]?()
      `, `
        if (typeof a[b] === 'function') {
          a[b]();
        }
      `, `
        a[b]?.();
      `);
    });

    it('works with non-repeatable dynamic member access as the function', () => {
      checkSoak(`
        a()[b]?()
      `, `
        __guardMethod__(a(), b, (o, m) => o[m]());
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `, `
        a()[b]?.();
      `);
    });

    it('works with dynamic member access whose key is unsafe to repeat as the function', () => {
      checkSoak(`
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
      `, `
        a[b()]?.();
      `);
    });

    it('allows undeclared variables for soaked function calls in an expression context', () => {
      checkSoak(`
        a = b?()
      `, `
        const a = typeof b === 'function' ? b() : undefined;
      `, `
        const a = typeof b === 'function' ? b() : undefined;
      `);
    });

    it('does not crash when using a soaked member access on an undeclared variable', () => {
      validateSoak(`
        a?.b
        setResult(true)
      `, true);
    });

    it('does not crash when using a soaked dynamic member access on an undeclared variable', () => {
      validateSoak(`
        a?['b']
        setResult(true)
      `, true);
    });

    it('does not crash when using a soaked function invocation on an undeclared variable', () => {
      validateSoak(`
        a?()
        setResult(true)
      `, true);
    });

    it('evaluates soaked function calls', () => {
      validateSoak(`
        f = -> 3
        setResult(f?())
      `, 3);
    });

    // Skip for now because the optional chaining implementation doesn't handle
    // this case.
    it.skip('skips soaked function invocations on non-functions', () => {
      validateSoak(`
        f = 3
        setResult('' + f?())
      `, 'undefined');
    });

    it('properly sets this in soaked method calls', () => {
      validateSoak(`
        o = false
        a = {
          b: ->
            if a == this
              o = true
        }
        a.b?()
        setResult(o)
      `, true);
    });

    it('properly sets `this` in shorthand-`this` soaked method calls', () => {
      validateSoak(`
        o = false
        a = {
          b: ->
            @c?()
          c: ->
            if a == this
              o = true
        }
        a.b()
        setResult(o)
      `, true);
    });

    it('properly sets `this` in soaked dynamic method calls', () => {
      validateSoak(`
        o = false
        a = {
          b: ->
            if a == this
              o = true
        }
        a['b']?()
        setResult(o)
      `, true);
    });
  });

  describe('soaked member access', () => {
    it('handles soaked member access assignment', () => {
      checkSoak(`
        canvasContext = null
        canvasContext?.font = $('body').css('font')
      `, `
        const canvasContext = null;
        if (canvasContext != null) {
          canvasContext.font = $('body').css('font');
        }
      `, `
        const canvasContext = null;
        canvasContext?.font = $('body').css('font');
      `);
    });

    it('handles soaked member access with conflicting variable names', () => {
      checkSoak(`
        x = 5
        a()?.b(x)
      `, `
        const x = 5;
        __guard__(a(), x1 => x1.b(x));
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        const x = 5;
        a()?.b(x);
      `);
    });

    it('handles soaked member access with assignment within an expression', () => {
      checkSoak(`
        b = null
        a(b?.c = d)
      `, `
        const b = null;
        a(b != null ? b.c = d : undefined);
      `, `
        const b = null;
        a(b?.c = d);
      `);
    });

    it('handles soaked member access with a function call', () => {
      checkSoak(`
        a = null
        a?.b()
      `, `
        const a = null;
        if (a != null) {
          a.b();
        }
      `, `
        const a = null;
        a?.b();
      `);
    });

    it('handles soaked member access on the result of a function call', () => {
      checkSoak(`
        a.b()?.c
      `, `
        __guard__(a.b(), x => x.c);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        a.b()?.c;
      `);
    });

    it('allows soaked member access to be used in an expression', () => {
      checkSoak(`
        b = null
        a(b?.c)
      `, `
        const b = null;
        a(b != null ? b.c : undefined);
      `, `
        const b = null;
        a(b?.c);
      `);
    });

    it('handles dynamic member access', () => {
      checkSoak(`
        a = null
        a?[b]()
      `, `
        const a = null;
        if (a != null) {
          a[b]();
        }
      `, `
        const a = null;
        a?.[b]();
      `);
    });

    it('handles soaked dynamic member access followed by normal dynamic member access', () => {
      checkSoak(`
        a = null
        a?[b].c[d]
      `, `
        const a = null;
        if (a != null) {
          a[b].c[d];
        }
      `, `
        const a = null;
        a?.[b].c[d];
      `);
    });

    it('handles nested soaked dynamic member access', () => {
      checkSoak(`
        a = null
        a?[b].c?[d]
      `, `
        const a = null;
        __guard__(a != null ? a[b].c : undefined, x => x[d]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        const a = null;
        a?.[b].c?.[d];
      `);
    });

    it('allows undeclared variables for soaked dynamic member accesses in an expression context', () => {
      checkSoak(`
        a = b?[c]
      `, `
        const a = typeof b !== 'undefined' && b !== null ? b[c] : undefined;
      `, `
        const a = typeof b !== 'undefined' && b !== null ? b[c] : undefined;
      `);
    });

    it('uses a shorter check for declared variables for soaked dynamic member accesses in an expression context', () => {
      checkSoak(`
        b = {}
        a = b?[c]
      `, `
        const b = {};
        const a = b != null ? b[c] : undefined;
      `, `
        const b = {};
        const a = b?.[c];
      `);
    });

    it('handles soaked member access within a condition', () => {
      checkSoak(`
        a = null
        if a?.b then c
      `, `
        const a = null;
        if (a != null ? a.b : undefined) { c; }
      `, `
        const a = null;
        if (a?.b) { c; }
      `);
    });

    it('handles nested soaked member access', () => {
      checkSoak(`
        a()?.b()?.c = 0;
      `, `
        __guard__(__guard__(a(), x1 => x1.b()), x => x.c = 0);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        a()?.b()?.c = 0;
      `);
    });

    it('handles explicit parens around soaks', () => {
      checkSoak(`
        a = null
        (a?.b).c
      `, `
        const a = null;
        (a != null ? a.b : undefined).c;
      `, `
        const a = null;
        (a?.b).c;
      `);
    });

    it('keeps postfix ++ within soak expressions', () => {
      checkSoak(`
        a()?.b++
      `, `
        __guard__(a(), x => x.b++);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        a()?.b++;
      `);
    });

    it('keeps postfix -- within soak expressions', () => {
      checkSoak(`
        a()?.b--
      `, `
        __guard__(a(), x => x.b--);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        a()?.b--;
      `);
    });

    it('keeps prefix ++ within soak expressions', () => {
      checkSoak(`
        ++a()?.b
      `, `
        __guard__(a(), x => ++x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        ++a()?.b;
      `);
    });

    it('keeps prefix ++ within soaked dynamic accesses', () => {
      checkSoak(`
        ++a()?[b]
      `, `
        __guard__(a(), x => ++x[b]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        ++a()?.[b];
      `);
    });

    it('keeps prefix ++ within soaked dynamic accesses where the LHS is surrounded by parens', () => {
      checkSoak(`
        ++(a())?[b]
      `, `
        __guard__((a()), x => ++x[b]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        ++(a())?.[b];
      `);
    });

    it('keeps prefix ++ within soaked function calls', () => {
      checkSoak(`
        ++a()?(b).c
      `, `
        __guardFunc__(a(), f => ++f(b).c);
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `, `
        ++a()?.(b).c;
      `);
    });

    it('keeps prefix ++ within soaked method calls', () => {
      checkSoak(`
        ++a().b?(c).d
      `, `
        __guardMethod__(a(), 'b', o => ++o.b(c).d);
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `, `
        ++a().b?.(c).d;
      `);
    });

    it('keeps prefix ++ within soaked dynamic method calls', () => {
      checkSoak(`
        ++a()[b]?(c).d
      `, `
        __guardMethod__(a(), b, (o, m) => ++o[m](c).d);
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `, `
        ++a()[b]?.(c).d;
      `);
    });

    it('keeps prefix -- within soak expressions', () => {
      checkSoak(`
        --a()?.b
      `, `
        __guard__(a(), x => --x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        --a()?.b;
      `);
    });

    it('keeps delete within soak expressions', () => {
      checkSoak(`
        delete a()?.b
      `, `
        __guard__(a(), x => delete x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        delete a()?.b;
      `);
    });

    it('handles soaked prototype access', () => {
      checkSoak(`
        a()?::b
      `, `
        __guard__(a(), x => x.prototype.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `, `
        a()?.prototype.b;
      `);
    });

    it('correctly handles normal soaked access', () => {
      validateSoak(`
        a = {b: 5}
        setResult(a?.b)
      `, 5);
    });

    it('correctly handles missing soaked access', () => {
      validateSoak(`
        a = {b: null}
        setResult('' + a.b?.c)
      `, 'undefined');
    });

    it('correctly handles dynamic soaked access', () => {
      validateSoak(`
        a = {b: 5}
        setResult(a?['b'])
      `, 5);
    });

    it('correctly handles missing dynamic soaked access', () => {
      validateSoak(`
        a = {b: null}
        setResult('' + a.b?['c'])
      `, 'undefined');
    });

    it('stops evaluating the expression when hitting a soak failure', () => {
        validateSoak(`
        a = {b: 5}
        setResult('' + a.d?.e.f())
      `, 'undefined');
    });

    it('skips assignment when a soak fails', () => {
      validateSoak(`
        x = 1
        y = null
        z = {}
        y?.a = x++
        z?.a = x++
        setResult(x)
      `, 2);
    });
  });

  it('handles a soaked method call on a soaked member access', () => {
    checkSoak(`
      a = {}
      a?.b?()
    `, `
      const a = {};
      __guardMethod__(a, 'b', o => o.b());
      function __guardMethod__(obj, methodName, transform) {
        if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
          return transform(obj, methodName);
        } else {
          return undefined;
        }
      }
    `, `
      const a = {};
      a?.b?.();
    `);
  });

  it('handles a soaked method call on a soaked dynamic member access', () => {
    checkSoak(`
      a = null
      a?[b]?()
    `, `
      const a = null;
      __guardMethod__(a, b, (o, m) => o[m]());
      function __guardMethod__(obj, methodName, transform) {
        if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
          return transform(obj, methodName);
        } else {
          return undefined;
        }
      }
    `, `
      const a = null;
      a?.[b]?.();
    `);
  });
  
  it('handles a combination of soaked function calls and soaked member accesses', () => {
    checkSoak(`
      a = null
      a?(1)?.b?()?[c].d?()?.e = 1
    `, `
      const a = null;
      __guard__(__guardMethod__(__guard__(__guardMethod__(typeof a === 'function' ? a(1) : undefined, 'b', o1 => o1.b()), x1 => x1[c]), 'd', o => o.d()), x => x.e = 1);
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
    `, `
      const a = null;
      a?.(1)?.b?.()?.[c].d?.()?.e = 1;
    `);
  });

  it('properly sets patching bounds for soaked function applications', () => {
    checkSoak(`
      f()?(a, 
        b: c
        d: e)
    `, `
      __guardFunc__(f(), f => f(a, { 
        b: c,
        d: e
      }));
      function __guardFunc__(func, transform) {
        return typeof func === 'function' ? transform(func) : undefined;
      }
    `, `
      f()?.(a, { 
        b: c,
        d: e
      });
    `);
  });

  it('properly transforms an `in` operator with a soak expression on the left', () => {
    checkSoak(`
      a = null
      a?.b in c
    `, `
      const a = null;
      Array.from(c).includes(a != null ? a.b : undefined);
    `, `
      const a = null;
      Array.from(c).includes(a?.b);
    `);
  });

  it('properly transforms an `in` operator with a soak expression on the right', () => {
    checkSoak(`
      b = null
      a in b?.c
    `, `
      const b = null;
      Array.from(b != null ? b.c : undefined).includes(a);
    `, `
      const b = null;
      Array.from(b?.c).includes(a);
    `);
  });

  it('handles a soaked access used with an existence operator', () => {
    checkSoak(`
      a = b()?.c ? d
    `, `
      let left;
      const a = (left = __guard__(b(), x => x.c)) != null ? left : d;
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let left;
      const a = (left = b()?.c) != null ? left : d;
    `);
  });

  it('handles a soaked dynamic access used with an existence operator', () => {
    checkSoak(`
      a = b()?[c()] ? d
    `, `
      let left;
      const a = (left = __guard__(b(), x => x[c()])) != null ? left : d;
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let left;
      const a = (left = b()?.[c()]) != null ? left : d;
    `);
  });

  it('handles a soaked access used with an existence assignment operator', () => {
    checkSoak(`
      a()?.b ?= c
    `, `
      let base;
      __guard__((base = a()), x => x.b != null ? base.b : (base.b = c));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let base;
      (base = a())?.b != null ? base.b : (base.b = c);
    `);
  });

  it('handles a soaked dynamic access used with an existence assignment operator', () => {
    checkSoak(`
      a()?[b()] ?= d
    `, `
      let name;
      let base;
      __guard__((base = a()), x => x[name = b()] != null ? base[name] : (base[name] = d));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let base, name;
      (base = a())?.[name = b()] != null ? base[name] : (base[name] = d);
    `);
  });

  it('handles a soaked access used with a logical assignment operator', () => {
    checkSoak(`
      a()?.b and= c
    `, `
      let base;
      __guard__((base = a()), x => x.b && (base.b = c));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let base;
      (base = a())?.b && (base.b = c);
    `);
  });

  it('handles a soaked dynamic access used with a logical assignment operator', () => {
    checkSoak(`
      a()?[b()] and= d
    `, `
      let name;
      let base;
      __guard__((base = a()), x => x[name = b()] && (base[name] = d));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let base, name;
      (base = a())?.[name = b()] && (base[name] = d);
    `);
  });

  it('allows a repeated soak operation as a loop target', () => {
    checkSoak(`
      i + j for j, i in foo()?.bar ? [] 
    `, `
      let left;
      const iterable = (left = __guard__(foo(), x => x.bar)) != null ? left : [];
      for (let i = 0; i < iterable.length; i++) { const j = iterable[i]; i + j; } 
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let left;
      const iterable = (left = foo()?.bar) != null ? left : [];
      for (let i = 0; i < iterable.length; i++) { const j = iterable[i]; i + j; } 
    `);
  });

  it('handles a soaked dynamic access used with a logical assignment operator with a function RHS', () => {
    checkSoak(`
      a.b()?.c or= (it) -> it
    `, `
      let base;
      __guard__((base = a.b()), x => x.c || (base.c = it => it));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let base;
      (base = a.b())?.c || (base.c = it => it);
    `);
  });

  it('handles a possibly undeclared variable in a statement context', () => {
    checkSoak(`
      ++a?.b[c()]
    `, `
      if (typeof a !== 'undefined' && a !== null) {
        ++a.b[c()];
      }
    `, `
      if (typeof a !== 'undefined' && a !== null) {
        ++a.b[c()];
      }
    `);
  });

  it('handles a simple identifier that has been declared in a statement context', () => {
    checkSoak(`
      a = f()
      ++a?.b[c()]
    `, `
      const a = f();
      if (a != null) {
        ++a.b[c()];
      }
    `, `
      const a = f();
      ++a?.b[c()];
    `);
  });

  it('handles a possibly undeclared variable in an expression context', () => {
    checkSoak(`
      x = ++a?.b[c()]
    `, `
      const x = typeof a !== 'undefined' && a !== null ? ++a.b[c()] : undefined;
    `, `
      const x = typeof a !== 'undefined' && a !== null ? ++a.b[c()] : undefined;
    `);
  });

  it('handles a simple identifier that has been declared in an expression context', () => {
    checkSoak(`
      a = f()
      x = ++a?.b[c()]
    `, `
      const a = f();
      const x = a != null ? ++a.b[c()] : undefined;
    `, `
      const a = f();
      const x = ++a?.b[c()];
    `);
  });

  it('properly follows precedence with soak expressions', () => {
    checkSoak(`
      a = f()
      x = a?.b or []
    `, `
      const a = f();
      const x = (a != null ? a.b : undefined) || [];
    `, `
      const a = f();
      const x = a?.b || [];
    `);
  });

  it('properly handles chained simple soak operations', () => {
    checkSoak(`
      a = f()
      if a?.b?.c?
        d
    `, `
      const a = f();
      if (__guard__(a != null ? a.b : undefined, x => x.c) != null) {
        d;
      }
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      const a = f();
      if (a?.b?.c != null) {
        d;
      }
    `);
  });

  it('properly handles a soaked method call followed by a binary exists op', () => {
    checkSoak(`
      b = null
      a = b?.filter(-> c) ? null
    `, `
      let left;
      const b = null;
      const a = (left = (b != null ? b.filter(() => c) : undefined)) != null ? left : null;
    `, `
      let left;
      const b = null;
      const a = (left = b?.filter(() => c)) != null ? left : null;
    `);
  });

  it('properly handles a soak operation inside a ternary', () => {
    checkSoak(`
      b = 0
      a = if b?.c then d else e
    `, `
      const b = 0;
      const a = (b != null ? b.c : undefined) ? d : e;
    `, `
      const b = 0;
      const a = b?.c ? d : e;
    `);
  });

  it('has the correct runtime behavior with a soak operation inside a ternary', () => {
    validateSoak(`
      a = {b: 'should not return'}
      setResult(if a?.b then 'should return')
    `, 'should return');
  });

  it('does not add parens around a soaked while condition', () => {
    checkSoak(`
      a = {}
      while a?.b
        break
    `, `
      const a = {};
      while (a != null ? a.b : undefined) {
        break;
      }
    `, `
      const a = {};
      while (a?.b) {
        break;
      }
    `);
  });

  it('does not add parens around a soaked indexing expression', () => {
    checkSoak(`
      a = {}
      b = {}
      d = a[b?.c]
    `, `
      const a = {};
      const b = {};
      const d = a[b != null ? b.c : undefined];
    `, `
      const a = {};
      const b = {};
      const d = a[b?.c];
    `);
  });

  it('properly handles a soaked condition in an `unless` statement', () => {
    checkSoak(`
      a = null
      unless a?.b
        c
    `, `
      const a = null;
      if (!(a != null ? a.b : undefined)) {
        c;
      }
    `, `
      const a = null;
      if (!a?.b) {
        c;
      }
    `);
  });

  it('properly handles a soaked condition in an `until` statement', () => {
    checkSoak(`
      a = null
      until a?.b
        c
    `, `
      const a = null;
      while (!(a != null ? a.b : undefined)) {
        c;
      }
    `, `
      const a = null;
      while (!a?.b) {
        c;
      }
    `);
  });

  it('properly handles a soaked condition in an `unless` statement with an assignment', () => {
    checkSoak(`
      b = null
      unless a = b?.c
        d
    `, `
      let a;
      const b = null;
      if (!(a = b != null ? b.c : undefined)) {
        d;
      }
    `, `
      let a;
      const b = null;
      if (!(a = b?.c)) {
        d;
      }
    `);
  });

  it('properly patches the object key in a soaked dynamic member access', () => {
    checkSoak(`
      a = null
      a?[@b]
    `, `
      const a = null;
      if (a != null) {
        a[this.b];
      }
    `, `
      const a = null;
      a?.[this.b];
    `);
  });

  it('properly places parens for expression-style soaked assignment', () => {
    checkSoak(`
      b = null
      a = b?.c = 1
    `, `
      const b = null;
      const a = (b != null ? b.c = 1 : undefined);
    `, `
      const b = null;
      const a = (b?.c = 1);
    `);
  });

  it('handles simple soaked new operations', () => {
    checkSoak(`
      A = null
      new A?(b)
    `, `
      const A = null;
      if (typeof A === 'function') {
        new A(b);
      }
    `, `
      const A = null;
      new A?.(b);
    `);
  });

  it('handles implicit soaked new operations', () => {
    checkSoak(`
      A = null
      new A? b
    `, `
      const A = null;
      if (typeof A === 'function') {
        new A(b);
      }
    `, `
      const A = null;
      new A?.(b);
    `);
  });

  it('handles complex soaked new operations', () => {
    checkSoak(`
      new A[b()]?(c)
    `, `
      __guardFunc__(A[b()], f => new f(c));
      function __guardFunc__(func, transform) {
        return typeof func === 'function' ? transform(func) : undefined;
      }
    `, `
      new A[b()]?.(c);
    `);
  });

  it('handles soaked slice operations', () => {
    checkSoak(`
      a = b?[c..d]
    `, `
      const a = __guard__(b, x => x.slice(c, +d + 1 || undefined));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      const a = b?.slice(c, +d + 1 || undefined);
    `);
  });

  it('properly computes the soak container for soaked slice operations', () => {
    checkSoak(`
      a = b?[c..d].e
    `, `
      const a = __guard__(b, x => x.slice(c, +d + 1 || undefined).e);
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      const a = b?.slice(c, +d + 1 || undefined).e;
    `);
  });

  it('handles soaked splice operations', () => {
    checkSoak(`
      a?[b..c] = d
    `, `
      __guard__(a, x => x.splice(b, c - b + 1, ...[].concat(d)));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      a?.splice(b, c - b + 1, ...[].concat(d));
    `);
  });

  it('handles complex splice operations', () => {
    checkSoak(`
      [a, b()?[c..]] = d
    `, `
      let a;
      a = d[0], __guard__(b(), x => x.splice(c, 9e9, ...[].concat(d[1])));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, `
      let a;
      a = d[0], b()?.splice(c, 9e9, ...[].concat(d[1]));
    `);
  });

  it('handles a parenthesized soak operation within `unless`', () => {
    checkSoak(`
      a = {b: 1}
      unless (a?.b)
        c
    `, `
      const a = {b: 1};
      if (!(a != null ? a.b : undefined)) {
        c;
      }
    `, `
      const a = {b: 1};
      if (!a?.b) {
        c;
      }
    `);
  });

  it('handles a nested parenthesized soak operation within `unless`', () => {
    checkSoak(`
      a = {b: 1}
      unless (a?.b.c)
        d
    `, `
      const a = {b: 1};
      if (!(a != null ? a.b.c : undefined)) {
        d;
      }
    `, `
      const a = {b: 1};
      if (!a?.b.c) {
        d;
      }
    `);
  });

  it('handles a parenthesized soak operation within `until`', () => {
    checkSoak(`
      a = {b: 1}
      until (a?.b)
        c
    `, `
      const a = {b: 1};
      while (!(a != null ? a.b : undefined)) {
        c;
      }
    `, `
      const a = {b: 1};
      while (!a?.b) {
        c;
      }
    `);
  });

  it('handles a parenthesized soak operation within a negated logical operator', () => {
    checkSoak(`
      a = {b: 1}
      unless c and (a?.b)
        d
    `, `
      const a = {b: 1};
      if (!c || (!(a != null ? a.b : undefined))) {
        d;
      }
    `, `
      const a = {b: 1};
      if (!c || (!a?.b)) {
        d;
      }
    `);
  });

  it('handles a parenthesized soak operation within a negated switch case', () => {
    checkSoak(`
      a = {b: 1}
      switch
        when (a?.b)
          c
    `, `
      const a = {b: 1};
      switch (false) {
        case (!(a != null ? a.b : undefined)):
          c;
          break;
      }
    `, `
      const a = {b: 1};
      switch (false) {
        case (!a?.b):
          c;
          break;
      }
    `);
  });
});
