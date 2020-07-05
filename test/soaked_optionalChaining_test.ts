import check from './support/check';
import validate from './support/validate';

function checkOptionalChaining(source: string, expected: string): void {
  check(source, expected, { options: { optionalChaining: true } });
}

describe('soaked expressions', () => {
  describe('function application', () => {
    it('works with a basic function', () => {
      checkOptionalChaining(
        `
        a = null
        a?()
      `,
        `
        const a = null;
        a?.();
      `
      );
    });

    it('works with a function that is not safe to repeat', () => {
      checkOptionalChaining(
        `
        a()?()
      `,
        `
        a()?.();
      `
      );
    });

    it('works in an expression context', () => {
      checkOptionalChaining(
        `
        a(b()?())
      `,
        `
        a(b()?.());
      `
      );
    });

    it('preserves arguments', () => {
      checkOptionalChaining(
        `
        a()?(1, 2, 3)
      `,
        `
        a()?.(1, 2, 3);
      `
      );
    });

    it('handles nested soaked function calls', () => {
      checkOptionalChaining(
        `
        a = null
        a?(1)?(2)
      `,
        `
        const a = null;
        __guardFunc__(typeof a === 'function' ? a(1) : undefined, f => f(2));
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `
      );
    });

    it('works with repeatable member access as the function', () => {
      checkOptionalChaining(
        `
        a.b?()
      `,
        `
        if (typeof a.b === 'function') {
          a.b();
        }
      `
      );
    });

    it('works with non-repeatable member access as the function', () => {
      checkOptionalChaining(
        `
        a().b?()
      `,
        `
        __guardMethod__(a(), 'b', o => o.b());
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `
      );
    });

    it('works with repeatable dynamic member access as the function', () => {
      checkOptionalChaining(
        `
        a[b]?()
      `,
        `
        if (typeof a[b] === 'function') {
          a[b]();
        }
      `
      );
    });

    it('works with non-repeatable dynamic member access as the function', () => {
      checkOptionalChaining(
        `
        a()[b]?()
      `,
        `
        __guardMethod__(a(), b, (o, m) => o[m]());
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `
      );
    });

    it('works with dynamic member access whose key is unsafe to repeat as the function', () => {
      checkOptionalChaining(
        `
        a[b()]?()
      `,
        `
        __guardMethod__(a, b(), (o, m) => o[m]());
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `
      );
    });

    it('allows undeclared variables for soaked function calls in an expression context', () => {
      checkOptionalChaining(
        `
        a = b?()
      `,
        `
        const a = typeof b === 'function' ? b() : undefined;
      `
      );
    });

    it('does not crash when using a soaked member access on an undeclared variable', () => {
      validate(
        `
        a?.b
        setResult(true)
      `,
        true
      );
    });

    it('does not crash when using a soaked dynamic member access on an undeclared variable', () => {
      validate(
        `
        a?['b']
        setResult(true)
      `,
        true
      );
    });

    it('does not crash when using a soaked function invocation on an undeclared variable', () => {
      validate(
        `
        a?()
        setResult(true)
      `,
        true
      );
    });

    it('evaluates soaked function calls', () => {
      validate(
        `
        f = -> 3
        setResult(f?())
      `,
        3
      );
    });

    it('properly sets this in soaked method calls', () => {
      validate(
        `
        o = false
        a = {
          b: ->
            if a == this
              o = true
        }
        a.b?()
        setResult(o)
      `,
        true
      );
    });

    it('properly sets `this` in shorthand-`this` soaked method calls', () => {
      validate(
        `
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
      `,
        true
      );
    });

    it('properly sets `this` in soaked dynamic method calls', () => {
      validate(
        `
        o = false
        a = {
          b: ->
            if a == this
              o = true
        }
        a['b']?()
        setResult(o)
      `,
        true
      );
    });
  });

  describe('soaked member access', () => {
    it('handles soaked member access assignment', () => {
      checkOptionalChaining(
        `
        canvasContext = null
        canvasContext?.font = $('body').css('font')
      `,
        `
        const canvasContext = null;
        if (canvasContext != null) {
          canvasContext.font = $('body').css('font');
        }
      `
      );
    });

    it('handles soaked member access with conflicting variable names', () => {
      checkOptionalChaining(
        `
        x = 5
        a()?.b(x)
      `,
        `
        const x = 5;
        __guard__(a(), x1 => x1.b(x));
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('handles soaked member access with assignment within an expression', () => {
      checkOptionalChaining(
        `
        b = null
        a(b?.c = d)
      `,
        `
        const b = null;
        a(b != null ? b.c = d : undefined);
      `
      );
    });

    it('handles soaked member access with a function call', () => {
      checkOptionalChaining(
        `
        a = null
        a?.b()
      `,
        `
        const a = null;
        if (a != null) {
          a.b();
        }
      `
      );
    });

    it('handles soaked member access on the result of a function call', () => {
      checkOptionalChaining(
        `
        a.b()?.c
      `,
        `
        __guard__(a.b(), x => x.c);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('allows soaked member access to be used in an expression', () => {
      checkOptionalChaining(
        `
        b = null
        a(b?.c)
      `,
        `
        const b = null;
        a(b != null ? b.c : undefined);
      `
      );
    });

    it('handles dynamic member access', () => {
      checkOptionalChaining(
        `
        a = null
        a?[b]()
      `,
        `
        const a = null;
        if (a != null) {
          a[b]();
        }
      `
      );
    });

    it('handles soaked dynamic member access followed by normal dynamic member access', () => {
      checkOptionalChaining(
        `
        a = null
        a?[b].c[d]
      `,
        `
        const a = null;
        if (a != null) {
          a[b].c[d];
        }
      `
      );
    });

    it('handles nested soaked dynamic member access', () => {
      checkOptionalChaining(
        `
        a = null
        a?[b].c?[d]
      `,
        `
        const a = null;
        __guard__(a != null ? a[b].c : undefined, x => x[d]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('allows undeclared variables for soaked dynamic member accesses in an expression context', () => {
      checkOptionalChaining(
        `
        a = b?[c]
      `,
        `
        const a = typeof b !== 'undefined' && b !== null ? b[c] : undefined;
      `
      );
    });

    it('uses a shorter checkOptionalChaining for declared variables for soaked dynamic member accesses in an expression context', () => {
      checkOptionalChaining(
        `
        b = {}
        a = b?[c]
      `,
        `
        const b = {};
        const a = b != null ? b[c] : undefined;
      `
      );
    });

    it('handles soaked member access within a condition', () => {
      checkOptionalChaining(
        `
        a = null
        if a?.b then c
      `,
        `
        const a = null;
        if (a != null ? a.b : undefined) { c; }
      `
      );
    });

    it('handles nested soaked member access', () => {
      checkOptionalChaining(
        `
        a()?.b()?.c = 0;
      `,
        `
        __guard__(__guard__(a(), x1 => x1.b()), x => x.c = 0);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('handles explicit parens around soaks', () => {
      checkOptionalChaining(
        `
        a = null
        (a?.b).c
      `,
        `
        const a = null;
        (a != null ? a.b : undefined).c;
      `
      );
    });

    it('keeps postfix ++ within soak expressions', () => {
      checkOptionalChaining(
        `
        a()?.b++
      `,
        `
        __guard__(a(), x => x.b++);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('keeps postfix -- within soak expressions', () => {
      checkOptionalChaining(
        `
        a()?.b--
      `,
        `
        __guard__(a(), x => x.b--);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('keeps prefix ++ within soak expressions', () => {
      checkOptionalChaining(
        `
        ++a()?.b
      `,
        `
        __guard__(a(), x => ++x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('keeps prefix ++ within soaked dynamic accesses', () => {
      checkOptionalChaining(
        `
        ++a()?[b]
      `,
        `
        __guard__(a(), x => ++x[b]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('keeps prefix ++ within soaked dynamic accesses where the LHS is surrounded by parens', () => {
      checkOptionalChaining(
        `
        ++(a())?[b]
      `,
        `
        __guard__((a()), x => ++x[b]);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('keeps prefix ++ within soaked function calls', () => {
      checkOptionalChaining(
        `
        ++a()?(b).c
      `,
        `
        __guardFunc__(a(), f => ++f(b).c);
        function __guardFunc__(func, transform) {
          return typeof func === 'function' ? transform(func) : undefined;
        }
      `
      );
    });

    it('keeps prefix ++ within soaked method calls', () => {
      checkOptionalChaining(
        `
        ++a().b?(c).d
      `,
        `
        __guardMethod__(a(), 'b', o => ++o.b(c).d);
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `
      );
    });

    it('keeps prefix ++ within soaked dynamic method calls', () => {
      checkOptionalChaining(
        `
        ++a()[b]?(c).d
      `,
        `
        __guardMethod__(a(), b, (o, m) => ++o[m](c).d);
        function __guardMethod__(obj, methodName, transform) {
          if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
            return transform(obj, methodName);
          } else {
            return undefined;
          }
        }
      `
      );
    });

    it('keeps prefix -- within soak expressions', () => {
      checkOptionalChaining(
        `
        --a()?.b
      `,
        `
        __guard__(a(), x => --x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('keeps delete within soak expressions', () => {
      checkOptionalChaining(
        `
        delete a()?.b
      `,
        `
        __guard__(a(), x => delete x.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('handles soaked prototype access', () => {
      checkOptionalChaining(
        `
        a()?::b
      `,
        `
        __guard__(a(), x => x.prototype.b);
        function __guard__(value, transform) {
          return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
        }
      `
      );
    });

    it('correctly handles normal soaked access', () => {
      validate(
        `
        a = {b: 5}
        setResult(a?.b)
      `,
        5
      );
    });

    it('correctly handles missing soaked access', () => {
      validate(
        `
        a = {b: null}
        setResult('' + a.b?.c)
      `,
        'undefined'
      );
    });

    it('correctly handles dynamic soaked access', () => {
      validate(
        `
        a = {b: 5}
        setResult(a?['b'])
      `,
        5
      );
    });

    it('correctly handles missing dynamic soaked access', () => {
      validate(
        `
        a = {b: null}
        setResult('' + a.b?['c'])
      `,
        'undefined'
      );
    });

    it('stops evaluating the expression when hitting a soak failure', () => {
      validate(
        `
        a = {b: 5}
        setResult('' + a.d?.e.f())
      `,
        'undefined'
      );
    });

    it('skips assignment when a soak fails', () => {
      validate(
        `
        x = 1
        y = null
        z = {}
        y?.a = x++
        z?.a = x++
        setResult(x)
      `,
        2
      );
    });
  });

  it('handles a soaked method call on a soaked member access', () => {
    checkOptionalChaining(
      `
      a = {}
      a?.b?()
    `,
      `
      const a = {};
      __guardMethod__(a, 'b', o => o.b());
      function __guardMethod__(obj, methodName, transform) {
        if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
          return transform(obj, methodName);
        } else {
          return undefined;
        }
      }
    `
    );
  });

  it('handles a soaked method call on a soaked dynamic member access', () => {
    checkOptionalChaining(
      `
      a = null
      a?[b]?()
    `,
      `
      const a = null;
      __guardMethod__(a, b, (o, m) => o[m]());
      function __guardMethod__(obj, methodName, transform) {
        if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
          return transform(obj, methodName);
        } else {
          return undefined;
        }
      }
    `
    );
  });

  it('handles a combination of soaked function calls and soaked member accesses', () => {
    checkOptionalChaining(
      `
      a = null
      a?(1)?.b?()?[c].d?()?.e = 1
    `,
      `
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
    `
    );
  });

  it('properly sets patching bounds for soaked function applications', () => {
    checkOptionalChaining(
      `
      f()?(a, 
        b: c
        d: e)
    `,
      `
      __guardFunc__(f(), f => f(a, { 
        b: c,
        d: e
      }));
      function __guardFunc__(func, transform) {
        return typeof func === 'function' ? transform(func) : undefined;
      }
    `
    );
  });

  it('properly transforms an `in` operator with a soak expression on the left', () => {
    checkOptionalChaining(
      `
      a = null
      a?.b in c
    `,
      `
      const a = null;
      Array.from(c).includes(a != null ? a.b : undefined);
    `
    );
  });

  it('properly transforms an `in` operator with a soak expression on the right', () => {
    checkOptionalChaining(
      `
      b = null
      a in b?.c
    `,
      `
      const b = null;
      Array.from(b != null ? b.c : undefined).includes(a);
    `
    );
  });

  it('handles a soaked access used with an existence operator', () => {
    checkOptionalChaining(
      `
      a = b()?.c ? d
    `,
      `
      let left;
      const a = (left = __guard__(b(), x => x.c)) != null ? left : d;
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles a soaked dynamic access used with an existence operator', () => {
    checkOptionalChaining(
      `
      a = b()?[c()] ? d
    `,
      `
      let left;
      const a = (left = __guard__(b(), x => x[c()])) != null ? left : d;
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles a soaked access used with an existence assignment operator', () => {
    checkOptionalChaining(
      `
      a()?.b ?= c
    `,
      `
      let base;
      __guard__((base = a()), x => x.b != null ? base.b : (base.b = c));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles a soaked dynamic access used with an existence assignment operator', () => {
    checkOptionalChaining(
      `
      a()?[b()] ?= d
    `,
      `
      let name;
      let base;
      __guard__((base = a()), x => x[name = b()] != null ? base[name] : (base[name] = d));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles a soaked access used with a logical assignment operator', () => {
    checkOptionalChaining(
      `
      a()?.b and= c
    `,
      `
      let base;
      __guard__((base = a()), x => x.b && (base.b = c));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles a soaked dynamic access used with a logical assignment operator', () => {
    checkOptionalChaining(
      `
      a()?[b()] and= d
    `,
      `
      let name;
      let base;
      __guard__((base = a()), x => x[name = b()] && (base[name] = d));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('allows a repeated soak operation as a loop target', () => {
    checkOptionalChaining(
      `
      i + j for j, i in foo()?.bar ? [] 
    `,
      `
      let left;
      const iterable = (left = __guard__(foo(), x => x.bar)) != null ? left : [];
      for (let i = 0; i < iterable.length; i++) { const j = iterable[i]; i + j; } 
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles a soaked dynamic access used with a logical assignment operator with a function RHS', () => {
    checkOptionalChaining(
      `
      a.b()?.c or= (it) -> it
    `,
      `
      let base;
      __guard__((base = a.b()), x => x.c || (base.c = it => it));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles a possibly undeclared variable in a statement context', () => {
    checkOptionalChaining(
      `
      ++a?.b[c()]
    `,
      `
      if (typeof a !== 'undefined' && a !== null) {
        ++a.b[c()];
      }
    `
    );
  });

  it('handles a simple identifier that has been declared in a statement context', () => {
    checkOptionalChaining(
      `
      a = f()
      ++a?.b[c()]
    `,
      `
      const a = f();
      if (a != null) {
        ++a.b[c()];
      }
    `
    );
  });

  it('handles a possibly undeclared variable in an expression context', () => {
    checkOptionalChaining(
      `
      x = ++a?.b[c()]
    `,
      `
      const x = typeof a !== 'undefined' && a !== null ? ++a.b[c()] : undefined;
    `
    );
  });

  it('handles a simple identifier that has been declared in an expression context', () => {
    checkOptionalChaining(
      `
      a = f()
      x = ++a?.b[c()]
    `,
      `
      const a = f();
      const x = a != null ? ++a.b[c()] : undefined;
    `
    );
  });

  it('properly follows precedence with soak expressions', () => {
    checkOptionalChaining(
      `
      a = f()
      x = a?.b or []
    `,
      `
      const a = f();
      const x = (a != null ? a.b : undefined) || [];
    `
    );
  });

  it('properly handles chained simple soak operations', () => {
    checkOptionalChaining(
      `
      a = f()
      if a?.b?.c?
        d
    `,
      `
      const a = f();
      if (__guard__(a != null ? a.b : undefined, x => x.c) != null) {
        d;
      }
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('properly handles a soaked method call followed by a binary exists op', () => {
    checkOptionalChaining(
      `
      b = null
      a = b?.filter(-> c) ? null
    `,
      `
      let left;
      const b = null;
      const a = (left = (b != null ? b.filter(() => c) : undefined)) != null ? left : null;
    `
    );
  });

  it('properly handles a soak operation inside a ternary', () => {
    checkOptionalChaining(
      `
      b = 0
      a = if b?.c then d else e
    `,
      `
      const b = 0;
      const a = (b != null ? b.c : undefined) ? d : e;
    `
    );
  });

  it('has the correct runtime behavior with a soak operation inside a ternary', () => {
    validate(
      `
      a = {b: 'should not return'}
      setResult(if a?.b then 'should return')
    `,
      'should return'
    );
  });

  it('does not add parens around a soaked while condition', () => {
    checkOptionalChaining(
      `
      a = {}
      while a?.b
        break
    `,
      `
      const a = {};
      while (a != null ? a.b : undefined) {
        break;
      }
    `
    );
  });

  it('does not add parens around a soaked indexing expression', () => {
    checkOptionalChaining(
      `
      a = {}
      b = {}
      d = a[b?.c]
    `,
      `
      const a = {};
      const b = {};
      const d = a[b != null ? b.c : undefined];
    `
    );
  });

  it('properly handles a soaked condition in an `unless` statement', () => {
    checkOptionalChaining(
      `
      a = null
      unless a?.b
        c
    `,
      `
      const a = null;
      if (!(a != null ? a.b : undefined)) {
        c;
      }
    `
    );
  });

  it('properly handles a soaked condition in an `until` statement', () => {
    checkOptionalChaining(
      `
      a = null
      until a?.b
        c
    `,
      `
      const a = null;
      while (!(a != null ? a.b : undefined)) {
        c;
      }
    `
    );
  });

  it('properly handles a soaked condition in an `unless` statement with an assignment', () => {
    checkOptionalChaining(
      `
      b = null
      unless a = b?.c
        d
    `,
      `
      let a;
      const b = null;
      if (!(a = b != null ? b.c : undefined)) {
        d;
      }
    `
    );
  });

  it('properly patches the object key in a soaked dynamic member access', () => {
    checkOptionalChaining(
      `
      a = null
      a?[@b]
    `,
      `
      const a = null;
      if (a != null) {
        a[this.b];
      }
    `
    );
  });

  it('properly places parens for expression-style soaked assignment', () => {
    checkOptionalChaining(
      `
      b = null
      a = b?.c = 1
    `,
      `
      const b = null;
      const a = (b != null ? b.c = 1 : undefined);
    `
    );
  });

  it('handles simple soaked new operations', () => {
    checkOptionalChaining(
      `
      A = null
      new A?(b)
    `,
      `
      const A = null;
      if (typeof A === 'function') {
        new A(b);
      }
    `
    );
  });

  it('handles implicit soaked new operations', () => {
    checkOptionalChaining(
      `
      A = null
      new A? b
    `,
      `
      const A = null;
      if (typeof A === 'function') {
        new A(b);
      }
    `
    );
  });

  it('handles complex soaked new operations', () => {
    checkOptionalChaining(
      `
      new A[b()]?(c)
    `,
      `
      __guardFunc__(A[b()], f => new f(c));
      function __guardFunc__(func, transform) {
        return typeof func === 'function' ? transform(func) : undefined;
      }
    `
    );
  });

  it('handles soaked slice operations', () => {
    checkOptionalChaining(
      `
      a = b?[c..d]
    `,
      `
      const a = __guard__(b, x => x.slice(c, +d + 1 || undefined));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('properly computes the soak container for soaked slice operations', () => {
    checkOptionalChaining(
      `
      a = b?[c..d].e
    `,
      `
      const a = __guard__(b, x => x.slice(c, +d + 1 || undefined).e);
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles soaked splice operations', () => {
    checkOptionalChaining(
      `
      a?[b..c] = d
    `,
      `
      __guard__(a, x => x.splice(b, c - b + 1, ...[].concat(d)));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles complex splice operations', () => {
    checkOptionalChaining(
      `
      [a, b()?[c..]] = d
    `,
      `
      let a;
      a = d[0], __guard__(b(), x => x.splice(c, 9e9, ...[].concat(d[1])));
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `
    );
  });

  it('handles a parenthesized soak operation within `unless`', () => {
    checkOptionalChaining(
      `
      a = {b: 1}
      unless (a?.b)
        c
    `,
      `
      const a = {b: 1};
      if (!(a != null ? a.b : undefined)) {
        c;
      }
    `
    );
  });

  it('handles a nested parenthesized soak operation within `unless`', () => {
    checkOptionalChaining(
      `
      a = {b: 1}
      unless (a?.b.c)
        d
    `,
      `
      const a = {b: 1};
      if (!(a != null ? a.b.c : undefined)) {
        d;
      }
    `
    );
  });

  it('handles a parenthesized soak operation within `until`', () => {
    checkOptionalChaining(
      `
      a = {b: 1}
      until (a?.b)
        c
    `,
      `
      const a = {b: 1};
      while (!(a != null ? a.b : undefined)) {
        c;
      }
    `
    );
  });

  it('handles a parenthesized soak operation within a negated logical operator', () => {
    checkOptionalChaining(
      `
      a = {b: 1}
      unless c and (a?.b)
        d
    `,
      `
      const a = {b: 1};
      if (!c || (!(a != null ? a.b : undefined))) {
        d;
      }
    `
    );
  });

  it('handles a parenthesized soak operation within a negated switch case', () => {
    checkOptionalChaining(
      `
      a = {b: 1}
      switch
        when (a?.b)
          c
    `,
      `
      const a = {b: 1};
      switch (false) {
        case (!(a != null ? a.b : undefined)):
          c;
          break;
      }
    `
    );
  });
});
