import check from './support/check';

describe('suggestions', () => {
  it('provides a suggestion for the babel constructor workaround', () => {
    check(`
      class A extends B
        c: =>
          d
    `, `
      /*
       * decaffeinate suggestions:
       * DS001: Remove Babel/TypeScript constructor workaround
       * DS102: Remove unnecessary code created because of implicit returns
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      class A extends B {
        constructor(...args) {
          {
            // Hack: trick Babel/TypeScript into allowing this before super.
            if (false) { super(); }
            let thisFn = (() => { this; }).toString();
            let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
            eval(\`$\{thisName} = this;\`);
          }
          this.c = this.c.bind(this);
          super(...args);
        }
      
        c() {
          return d;
        }
      }
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('provides no suggestions for an ordinary file', () => {
    check(`
      x = 1
    `, `
      const x = 1;
    `, {
      options: {
        disableSuggestionComment: false,
      },
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
      /*
       * decaffeinate suggestions:
       * DS001: Remove Babel/TypeScript constructor workaround
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      class A extends B {
        constructor(c) {
          {
            // Hack: trick Babel/TypeScript into allowing this before super.
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
            // Hack: trick Babel/TypeScript into allowing this before super.
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
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests removing Array.from from for-of loops', () => {
    check(`
      for a in b
        c
    `, `
      /*
       * decaffeinate suggestions:
       * DS101: Remove unnecessary use of Array.from
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      for (let a of Array.from(b)) {
        c;
      }
    `, {
      options: {
        disableSuggestionComment: false,
      },
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
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests removing Array.from from includes usages', () => {
    check(`
      a in b
    `, `
      /*
       * decaffeinate suggestions:
       * DS101: Remove unnecessary use of Array.from
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      Array.from(b).includes(a);
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests cleaning up implicit returns', () => {
    check(`
      ->
        f()
    `, `
      /*
       * decaffeinate suggestions:
       * DS102: Remove unnecessary code created because of implicit returns
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      () => f();
    `, {
      options: {
        disableSuggestionComment: false,
      },
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
      options: {
        disableSuggestionComment: false,
      },
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
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests removing guard on complex soak operations', () => {
    check(`
      a()?.b
    `, `
      /*
       * decaffeinate suggestions:
       * DS103: Rewrite code to no longer use __guard__
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      __guard__(a(), x => x.b);
      function __guard__(value, transform) {
        return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
      }
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('does not suggest removing guard on simple soak operations', () => {
    check(`
      a?.b
    `, `
      /*
       * decaffeinate suggestions:
       * DS207: Consider shorter variations of null checks
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      if (typeof a !== 'undefined' && a !== null) {
        a.b;
      }
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests removing inline assignments', () => {
    check(`
      accounts[getAccountId()] //= splitFactor
    `, `
      /*
       * decaffeinate suggestions:
       * DS104: Avoid inline assignments
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      let name;
      accounts[name = getAccountId()] = Math.floor(accounts[name] / splitFactor);
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests removing assignments when the expression is already repeatable', () => {
    check(`
      accounts[accountId] //= splitFactor
    `, `
      accounts[accountId] = Math.floor(accounts[accountId] / splitFactor);
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests simplifying complex assignments', () => {
    check(`
      {a: [b, ..., c]} = d
    `, `
      /*
       * decaffeinate suggestions:
       * DS201: Simplify complex destructure assignments
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      const array = d.a, b = array[0], c = array[array.length - 1];
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('does not suggest simplifying simple assignments', () => {
    check(`
      {a: {b: c}} = d
    `, `
      const {a: {b: c}} = d;
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests simplifying dynamic range loops', () => {
    check(`
      for a in [b..c]
        d
    `, `
      /*
       * decaffeinate suggestions:
       * DS202: Simplify dynamic range loops
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      for (let a = b, end = c, asc = b <= end; asc ? a <= end : a >= end; asc ? a++ : a--) {
        d;
      }
    `, {
      options: {
        disableSuggestionComment: false,
      },
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
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests cleaning up || {} in a for-own loop', () => {
    check(`
      for own a of b
        c
    `, `
      /*
       * decaffeinate suggestions:
       * DS203: Remove \`|| {}\` from converted for-own loops
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      for (let a of Object.keys(b || {})) {
        c;
      }
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests cleaning up order for complex `includes` usage', () => {
    check(`
      a() in b()
    `, `
      /*
       * decaffeinate suggestions:
       * DS101: Remove unnecessary use of Array.from
       * DS104: Avoid inline assignments
       * DS204: Change includes calls to have a more natural evaluation order
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      let needle;
      (needle = a(), Array.from(b()).includes(needle));
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('does not suggest cleaning up order for simple `includes` usage', () => {
    check(`
      a in b
    `, `
      /*
       * decaffeinate suggestions:
       * DS101: Remove unnecessary use of Array.from
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      Array.from(b).includes(a);
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests avoiding IIFEs', () => {
    check(`
      x = try
        a
      catch b
        c
    `, `
      /*
       * decaffeinate suggestions:
       * DS205: Consider reworking code to avoid use of IIFEs
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      const x = (() => { try {
        return a;
      } catch (b) {
        return c;
      } })();
    `, {
      options: {
        disableSuggestionComment: false,
      },
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
      /*
       * decaffeinate suggestions:
       * DS102: Remove unnecessary code created because of implicit returns
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      (function() {
        if (a) {
          return b;
        } else {
          return c;
        }
      });
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests avoiding initClass when it is generated', () => {
    check(`
      class A
        b: c
    `, `
      /*
       * decaffeinate suggestions:
       * DS206: Consider reworking classes to avoid initClass
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      class A {
        static initClass() {
          this.prototype.b = c;
        }
      }
      A.initClass();
    `, {
      options: {
        disableSuggestionComment: false,
      },
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
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests shortening null checks for the binary existence operator', () => {
    check(`
      a = 1
      x = a ? b
    `, `
      /*
       * decaffeinate suggestions:
       * DS207: Consider shorter variations of null checks
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      const a = 1;
      const x = a != null ? a : b;
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests shortening null checks for the unary existence operator', () => {
    check(`
      a = 1
      b = a?
    `, `
      /*
       * decaffeinate suggestions:
       * DS207: Consider shorter variations of null checks
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      const a = 1;
      const b = (a != null);
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests removing top-level this', () => {
    check(`
      this
    `, `
      /*
       * decaffeinate suggestions:
       * DS208: Avoid top-level this
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      this;
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests removing top-level this within a fat arrow function', () => {
    check(`
      =>
        return this
    `, `
      /*
       * decaffeinate suggestions:
       * DS208: Avoid top-level this
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      () => {
        return this;
      };
    `, {
      options: {
        disableSuggestionComment: false,
      },
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
      options: {
        disableSuggestionComment: false,
      },
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
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('suggests removing top-level return', () => {
    check(`
      if foo
        return
    `, `
      /*
       * decaffeinate suggestions:
       * DS209: Avoid top-level return
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      if (foo) {
        return;
      }
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });

  it('preserves a shebang line at the top of the file', () => {
    check(`
      #!/usr/bin/env coffee
      a?.b
    `, `
      #!/usr/bin/env node
      /*
       * decaffeinate suggestions:
       * DS207: Consider shorter variations of null checks
       * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
       */
      if (typeof a !== 'undefined' && a !== null) {
        a.b;
      }
    `, {
      options: {
        disableSuggestionComment: false,
      },
    });
  });
});
