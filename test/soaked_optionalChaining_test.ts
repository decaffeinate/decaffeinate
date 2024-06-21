import check from './support/check';
import validate from './support/validate';
import assertError from './support/assertError';

function checkOptionalChaining(source: string, expected: string): void {
  check(source, expected, { options: { optionalChaining: true } });
}

const testFunctionApplication = false; // TODO

describe('soaked expressions', () => {
  describe('function application', () => {
    if (!testFunctionApplication) return;
    it('works with a basic function', () => {
      checkOptionalChaining(
        `
        a = null
        a?()
      `,
        `
        const a = null;
        a?.();
      `,
      );
    });

    it('works with a function that is not safe to repeat', () => {
      checkOptionalChaining(
        `
        a()?()
      `,
        `
        a()?.();
      `,
      );
    });

    it('works in an expression context', () => {
      checkOptionalChaining(
        `
        a(b()?())
      `,
        `
        a(b()?.());
      `,
      );
    });

    it('preserves arguments', () => {
      checkOptionalChaining(
        `
        a()?(1, 2, 3)
      `,
        `
        a()?.(1, 2, 3);
      `,
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
        a?.(1)?.(2);
      `,
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
      `,
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
      `,
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
      `,
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
      `,
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
      `,
      );
    });

    it('allows undeclared variables for soaked function calls in an expression context', () => {
      checkOptionalChaining(
        `
        a = b?()
      `,
        `
        const a = typeof b === 'function' ? b() : undefined;
      `,
      );
    });

    it('does not crash when using a soaked member access on an undeclared variable', () => {
      validate(
        `
        a?.b
        setResult(true)
      `,
        true,
        { options: { optionalChaining: true } },
      );
    });

    it('does not crash when using a soaked dynamic member access on an undeclared variable', () => {
      validate(
        `
        a?['b']
        setResult(true)
      `,
        true,
        { options: { optionalChaining: true } },
      );
    });

    it('does not crash when using a soaked function invocation on an undeclared variable', () => {
      validate(
        `
        a?()
        setResult(true)
      `,
        true,
        { options: { optionalChaining: true } },
      );
    });

    it('evaluates soaked function calls', () => {
      validate(
        `
        f = -> 3
        setResult(f?())
      `,
        3,
        { options: { optionalChaining: true } },
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
        true,
        { options: { optionalChaining: true } },
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
        true,
        { options: { optionalChaining: true } },
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
        true,
        { options: { optionalChaining: true } },
      );
    });
  });

  describe('soaked member access', () => {
    it('handles soaked member access assignment', () => {
      assertError(
        `
        canvasContext = null
        canvasContext?.font = $('body').css('font')
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
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
        a()?.b(x);
      `,
      );
    });

    it('disallows soaked member access with assignment within an expression', () => {
      assertError(
        `
        b = null
        a(b?.c = d)
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
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
        a?.b();
      `,
      );
    });

    it('handles soaked member access on the result of a function call', () => {
      checkOptionalChaining(
        `
        a.b()?.c
      `,
        `
        a.b()?.c;
      `,
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
        a(b?.c);
      `,
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
        a?.[b]();
      `,
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
        a?.[b].c[d];
      `,
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
        a?.[b].c?.[d];
      `,
      );
    });

    it('allows undeclared variables for soaked dynamic member accesses in an expression context', () => {
      checkOptionalChaining(
        `
        a = b?[c]
      `,
        `
        const a = b?.[c];
      `,
      );
    });

    it('uses a shorter check for declared variables for soaked dynamic member accesses in an expression context', () => {
      checkOptionalChaining(
        `
        b = {}
        a = b?[c]
      `,
        `
        const b = {};
        const a = b?.[c];
      `,
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
        if (a?.b) { c; }
      `,
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
        (a?.b).c;
      `,
      );
    });

    it('fails when used with postfix operation', () => {
      assertError(
        `
        a()?.b++
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
      );

      assertError(
        `
        a()?.b--
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
      );

      assertError(
        `
        ++a()?.b
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
      );

      assertError(
        `
        --a()?.b
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
      );

      assertError(
        `
        ++(a())?[b]
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
      );

      assertError(
        `
        --(a())?[b]
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
      );

      assertError(
        `
        ++a()?(b).c
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
      );

      assertError(
        `
        --a()?(b).c
      `,
        'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
        { optionalChaining: true },
      );
    });

    it('allows assignment with an ancestor of a soak outside a function boundary', () => {
      checkOptionalChaining(
        `
        (-> a?.b).c++
        `,
        `
        ((() => a?.b)).c++;
        `,
      );

      checkOptionalChaining(
        `
        a[b?.c]++
        `,
        `
        a[b?.c]++;
        `,
      );
    });

    it('keeps delete within soak expressions', () => {
      checkOptionalChaining(
        `
        delete a()?.b
      `,
        `
        delete a()?.b;
      `,
      );
    });

    it('handles soaked prototype access', () => {
      checkOptionalChaining(
        `
        a()?::b
      `,
        `
        a()?.prototype.b;
      `,
      );
    });

    it('correctly handles normal soaked access', () => {
      validate(
        `
        a = {b: 5}
        setResult(a?.b)
      `,
        5,
      );
    });

    it('correctly handles missing soaked access', () => {
      validate(
        `
        a = {b: null}
        setResult('' + a.b?.c)
      `,
        'undefined',
      );
    });

    it('correctly handles dynamic soaked access', () => {
      validate(
        `
        a = {b: 5}
        setResult(a?['b'])
      `,
        5,
      );
    });

    it('correctly handles missing dynamic soaked access', () => {
      validate(
        `
        a = {b: null}
        setResult('' + a.b?['c'])
      `,
        'undefined',
      );
    });

    it('stops evaluating the expression when hitting a soak failure', () => {
      validate(
        `
        a = {b: 5}
        setResult('' + a.d?.e.f())
      `,
        'undefined',
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
      a?.b?.();
    `,
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
      a?.[b]?.();
    `,
    );
  });

  it('handles a combination of soaked function calls and soaked member accesses', () => {
    checkOptionalChaining(
      `
      a = null
      a?(1)?.b?()?[c].d?()?.e
    `,
      `
      const a = null;
      a?.(1)?.b?.()?.[c].d?.()?.e;
    `,
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
      f()?.(a, {
        b: c,
        d: e
      });
    `,
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
      Array.from(c).includes(a?.b);
    `,
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
      Array.from(b?.c).includes(a);
    `,
    );
  });

  it('handles a soaked access used with an existence operator', () => {
    checkOptionalChaining(
      `
      a = b()?.c ? d
    `,
      `
      let left;
      const a = (left = b()?.c) != null ? left : d;
    `,
    );
  });

  it('handles a soaked dynamic access used with an existence operator', () => {
    checkOptionalChaining(
      `
      a = b()?[c()] ? d
    `,
      `
      let left;
      const a = (left = b()?.[c()]) != null ? left : d;
    `,
    );
  });

  it('fails with nullish coalescing assignment', () => {
    assertError(
      `
      a()?.b ?= c
    `,
      'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
      { optionalChaining: true },
    );

    assertError(
      `
      a()?[b()] ?= d
    `,
      'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
      { optionalChaining: true },
    );

    assertError(
      `
      a()?.b and= c
    `,
      'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
      { optionalChaining: true },
    );

    assertError(
      `
      a()?[b()] and= d
    `,
      'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
      { optionalChaining: true },
    );

    assertError(
      `
      a.b()?.c or= (it) -> it
    `,
      'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
      { optionalChaining: true },
    );
  });

  it('allows a repeated soak operation as a loop target', () => {
    checkOptionalChaining(
      `
      i + j for j, i in foo()?.bar ? [] 
    `,
      `
      let left;
      const iterable = (left = foo()?.bar) != null ? left : [];
      for (let i = 0; i < iterable.length; i++) { const j = iterable[i]; i + j; } 
    `,
    );
  });

  it('handles a possibly undeclared variable in a statement context', () => {
    checkOptionalChaining(
      `
      a?.b[c()]()
    `,
      `
      a?.b[c()]();
    `,
    );
  });

  it('handles a simple identifier that has been declared in a statement context', () => {
    checkOptionalChaining(
      `
      a = f()
      a?.b[c()]
    `,
      `
      const a = f();
      a?.b[c()];
    `,
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
      const x = a?.b || [];
    `,
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
      if (a?.b?.c != null) {
        d;
      }
    `,
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
      const a = (left = b?.filter(() => c)) != null ? left : null;
    `,
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
      const a = b?.c ? d : e;
    `,
    );
  });

  it('has the correct runtime behavior with a soak operation inside a ternary', () => {
    validate(
      `
      a = {b: 'should not return'}
      setResult(if a?.b then 'should return')
    `,
      'should return',
      { options: { optionalChaining: true }, skipNodeCheck: true },
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
      while (a?.b) {
        break;
      }
    `,
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
      const d = a[b?.c];
    `,
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
      if (!a?.b) {
        c;
      }
    `,
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
      while (!a?.b) {
        c;
      }
    `,
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
      if (!(a = b?.c)) {
        d;
      }
    `,
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
      a?.[this.b];
    `,
    );
  });

  it('properly places parens for expression-style soaked assignment', () => {
    assertError(
      `
      b = null
      a = b?.c = 1
    `,
      'JavaScript does not allow an optional chaining expression in an assignment position. Run without --optional-chaining or edit the original source to remove the assignment of an optional chaining expression.',
      { optionalChaining: true },
    );
  });

  it('fails with soaked new operations', () => {
    assertError(
      `
      A = null
      new A?(b)
    `,
      'JavaScript does not allow constructors with optional chaining. Run without --optional-chaining or edit the original source to manually invoke the constructor conditionally.',
      { optionalChaining: true },
    );

    assertError(
      `
      A = null
      new A? b
    `,
      'JavaScript does not allow constructors with optional chaining. Run without --optional-chaining or edit the original source to manually invoke the constructor conditionally.',
      { optionalChaining: true },
    );

    assertError(
      `
      new A[b()]?(c)
    `,
      'JavaScript does not allow constructors with optional chaining. Run without --optional-chaining or edit the original source to manually invoke the constructor conditionally.',
      { optionalChaining: true },
    );
  });

  it('handles soaked slice operations', () => {
    checkOptionalChaining(
      `
      a = b?[c..d]
    `,
      `
      const a = b?.slice(c, +d + 1 || undefined);
    `,
    );
  });

  it('properly computes the soak container for soaked slice operations', () => {
    checkOptionalChaining(
      `
      a = b?[c..d].e
    `,
      `
      const a = b?.slice(c, +d + 1 || undefined).e;
    `,
    );
  });

  it('handles soaked splice operations', () => {
    checkOptionalChaining(
      `
      a?[b..c] = d
    `,
      `
      a?.splice(b, c - b + 1, ...[].concat(d));
    `,
    );
  });

  it('handles complex splice operations', () => {
    checkOptionalChaining(
      `
      [a, b()?[c..]] = d
    `,
      `
      let a;
      a = d[0], b()?.splice(c, 9e9, ...[].concat(d[1]));
    `,
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
      if (!a?.b) {
        c;
      }
    `,
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
      if (!a?.b.c) {
        d;
      }
    `,
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
      while (!a?.b) {
        c;
      }
    `,
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
      if (!c || (!a?.b)) {
        d;
      }
    `,
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
        case (!a?.b):
          c;
          break;
      }
    `,
    );
  });
});
