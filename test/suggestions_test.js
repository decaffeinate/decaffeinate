import check from './support/check';
import {
  AVOID_IIFES, AVOID_INITCLASS,
  AVOID_INLINE_ASSIGNMENTS, AVOID_TOP_LEVEL_RETURN, AVOID_TOP_LEVEL_THIS,
  CLEAN_UP_FOR_OWN_LOOPS,
  CLEAN_UP_IMPLICIT_RETURNS, FIX_INCLUDES_EVALUATION_ORDER, REMOVE_ARRAY_FROM,
  REMOVE_BABEL_WORKAROUND, REMOVE_GUARD, SHORTEN_NULL_CHECKS,
  SIMPLIFY_COMPLEX_ASSIGNMENTS,
  SIMPLIFY_DYNAMIC_RANGE_LOOPS
} from '../src/suggestions';

describe('suggestions', () => {
  it('provides a suggestion for the babel constructor workaround', () => {
    check(`
      class A extends B
        c: =>
          d
    `, `
      class A extends B {
        constructor(...args) {
          {
            // Hack: trick babel into allowing this before super.
            if (false) { super(); }
            let thisFn = (() => { this; }).toString();
            let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
            eval(\`\${thisName} = this;\`);
          }
          this.c = this.c.bind(this);
          super(...args);
        }
      
        c() {
          return d;
        }
      }
    `, {
      options: {enableBabelConstructorWorkaround: true},
      expectedSuggestions: [
        REMOVE_BABEL_WORKAROUND,
        CLEAN_UP_IMPLICIT_RETURNS,
      ],
    });
  });

  it('provides no suggestions for an ordinary file', () => {
    check(`
      x = 1
    `, `
      let x = 1;
    `, {
      expectedSuggestions: [],
    });
  });

  it('only shows one of each suggestion', () => {
    check(`
      class A extends B
        constructor: (@c) ->
          super
      class E extends F
        constructor: (@g) ->
          super
    `, `
      class A extends B {
        constructor(c) {
          {
            // Hack: trick babel into allowing this before super.
            if (false) { super(); }
            let thisFn = (() => { this; }).toString();
            let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
            eval(\`$\{thisName} = this;\`);
          }
          this.c = c;
          super(...arguments);
        }
      }
      class E extends F {
        constructor(g) {
          {
            // Hack: trick babel into allowing this before super.
            if (false) { super(); }
            let thisFn = (() => { this; }).toString();
            let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
            eval(\`$\{thisName} = this;\`);
          }
          this.g = g;
          super(...arguments);
        }
      }
    `, {
      options: {enableBabelConstructorWorkaround: true},
      expectedSuggestions: [
        REMOVE_BABEL_WORKAROUND,
      ],
    });
  });

  it('suggests removing Array.from from for-of loops', () => {
    check(`
      for a in b
        c
    `, `
      for (let a of Array.from(b)) {
        c;
      }
    `, {
      expectedSuggestions: [
        REMOVE_ARRAY_FROM,
      ],
    });
  });

  it('does not suggest removing Array.from from for-of loops over an array literal', () => {
    check(`
      for a in [1, 2, 3]
        b
    `, `
      for (let a of [1, 2, 3]) {
        b;
      }
    `, {
      expectedSuggestions: [],
    });
  });

  it('suggests removing Array.from from includes usages', () => {
    check(`
      a in b
    `, `
      Array.from(b).includes(a);
    `, {
      expectedSuggestions: [
        REMOVE_ARRAY_FROM,
      ],
    });
  });

  it('suggests cleaning up implicit returns', () => {
    check(`
      ->
        f()
    `, `
      () => f();
    `, {
      expectedSuggestions: [
        CLEAN_UP_IMPLICIT_RETURNS,
      ],
    });
  });

  it('does not suggest implicit returns when there is an explicit return', () => {
    check(`
      ->
        f()
        return
    `, `
      (function() {
        f();
      });
    `, {
      expectedSuggestions: [],
    });
  });

  it('does not suggest implicit return cleanup for inline functions', () => {
    check(`
      values = [1, 2, 3]
      values = values.map((val) -> val + 1)
    `, `
      let values = [1, 2, 3];
      values = values.map(val => val + 1);
    `, {
      expectedSuggestions: [],
    });
  });

  it('suggests removing guard on complex soak operations', () => {
    check(`
      a()?.b
    `, `
      __guard__(a(), x => x.b);
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, {
      expectedSuggestions: [
        REMOVE_GUARD,
      ],
    });
  });

  it('does not suggest removing guard on simple soak operations', () => {
    check(`
      a?.b
    `, `
      if (typeof a !== 'undefined' && a !== null) {
        a.b;
      }
    `, {
      expectedSuggestions: [
        SHORTEN_NULL_CHECKS,
      ],
    });
  });

  it('suggests removing inline assignments', () => {
    check(`
      accounts[getAccountId()] //= splitFactor
    `, `
      let name;
      accounts[name = getAccountId()] = Math.floor(accounts[name] / splitFactor);
    `, {
      expectedSuggestions: [
        AVOID_INLINE_ASSIGNMENTS,
      ],
    });
  });

  it('suggests removing assignments when the expression is already repeatable', () => {
    check(`
      accounts[accountId] //= splitFactor
    `, `
      accounts[accountId] = Math.floor(accounts[accountId] / splitFactor);
    `, {
      expectedSuggestions: [],
    });
  });

  it('suggests simplifying complex assignments', () => {
    check(`
      {a: [b, ..., c]} = d
    `, `
      let array = d.a, b = array[0], c = array[array.length - 1];
    `, {
      expectedSuggestions: [
        SIMPLIFY_COMPLEX_ASSIGNMENTS,
      ],
    });
  });

  it('does not suggest simplifying simple assignments', () => {
    check(`
      {a: {b: c}} = d
    `, `
      let {a: {b: c}} = d;
    `, {
      expectedSuggestions: [],
    });
  });

  it('suggests simplifying dynamic range loops', () => {
    check(`
      for a in [b..c]
        d
    `, `
      for (let a = b, end = c, asc = b <= end; asc ? a <= end : a >= end; asc ? a++ : a--) {
        d;
      }
    `, {
      expectedSuggestions: [
        SIMPLIFY_DYNAMIC_RANGE_LOOPS,
      ],
    });
  });

  it('does not suggest simplifying loops with a known direction', () => {
    check(`
      for a in [b..c] by 1
        d
    `, `
      for (let a = b, end = c; a <= end; a++) {
        d;
      }
    `, {
      expectedSuggestions: [],
    });
  });

  it('suggests cleaning up || {} in a for-own loop', () => {
    check(`
      for own a of b
        c
    `, `
      for (let a of Object.keys(b || {})) {
        c;
      }
    `, {
      expectedSuggestions: [
        CLEAN_UP_FOR_OWN_LOOPS,
      ],
    });
  });

  it('suggests cleaning up order for complex `includes` usage', () => {
    check(`
      a() in b()
    `, `
      let needle;
      (needle = a(), Array.from(b()).includes(needle));
    `, {
      expectedSuggestions: [
        REMOVE_ARRAY_FROM,
        AVOID_INLINE_ASSIGNMENTS,
        FIX_INCLUDES_EVALUATION_ORDER,
      ],
    });
  });

  it('does not suggest cleaning up order for simple `includes` usage', () => {
    check(`
      a in b
    `, `
      Array.from(b).includes(a);
    `, {
      expectedSuggestions: [
        REMOVE_ARRAY_FROM,
      ],
    });
  });

  it('suggests avoiding IIFEs', () => {
    check(`
      x = try
        a
      catch b
        c
    `, `
      let x = (() => { try {
        return a;
      } catch (b) {
        return c;
      } })();
    `, {
      expectedSuggestions: [
        AVOID_IIFES,
      ],
    });
  });

  it('does not suggest avoiding IIFEs when the return is pushed down', () => {
    check(`
      ->
        return if a
          b
        else
          c
    `, `
      (function() {
        if (a) {
          return b;
        } else {
          return c;
        }
      });
    `, {
      expectedSuggestions: [
        CLEAN_UP_IMPLICIT_RETURNS,
      ],
    });
  });

  it('suggests avoiding initClass when it is generated', () => {
    check(`
      class A
        b: c
    `, `
      class A {
        static initClass() {
          this.prototype.b = c;
        }
      }
      A.initClass();
    `, {
      expectedSuggestions: [
        AVOID_INITCLASS,
      ],
    });
  });

  it('does not suggest avoiding initClass for normal classes', () => {
    check(`
      class A
        b: -> c
    `, `
      class A {
        b() { return c; }
      }
    `, {
      expectedSuggestions: [],
    });
  });

  it('suggests shortening null checks for the binary existence operator', () => {
    check(`
      a = 1
      x = a ? b
    `, `
      let a = 1;
      let x = a != null ? a : b;
    `, {
      expectedSuggestions: [
        SHORTEN_NULL_CHECKS,
      ],
    });
  });

  it('suggests shortening null checks for the unary existence operator', () => {
    check(`
      a = 1
      b = a?
    `, `
      let a = 1;
      let b = (a != null);
    `, {
      expectedSuggestions: [
        SHORTEN_NULL_CHECKS,
      ],
    });
  });

  it('suggests removing top-level this', () => {
    check(`
      this
    `, `
      this;
    `, {
      expectedSuggestions: [
        AVOID_TOP_LEVEL_THIS,
      ],
    });
  });

  it('suggests removing top-level this within a fat arrow function', () => {
    check(`
      =>
        return this
    `, `
      () => {
        return this;
      };
    `, {
      expectedSuggestions: [
        AVOID_TOP_LEVEL_THIS,
      ],
    });
  });

  it('does not suggest removing top-level this within a normal function', () => {
    check(`
      ->
        return this
    `, `
      (function() {
        return this;
      });
    `, {
      expectedSuggestions: [],
    });
  });

  it('does not consider a static method to use top-level this', () => {
    check(`
      class A
        @b: -> c
    `, `
      class A {
        static b() { return c; }
      }
    `, {
      expectedSuggestions: [],
    });
  });

  it('suggests removing top-level return', () => {
    check(`
      if foo
        return
    `, `
      if (foo) {
        return;
      }
    `, {
      expectedSuggestions: [
        AVOID_TOP_LEVEL_RETURN
      ],
    });
  });
});
