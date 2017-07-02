import check from './support/check';
import { REMOVE_BABEL_WORKAROUND } from '../src/suggestions';

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

});
