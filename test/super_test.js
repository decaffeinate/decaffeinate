import check from './support/check.js';

describe('super', () => {
  it('spreads `arguments` when no arguments are given', () => {
    check(`
      class C extends B
        constructor: (x) ->
          super

        fn: (x) ->
          super
    `, `
      class C extends B {
        constructor(x) {
          super(...arguments);
        }

        fn(x) {
          return super.fn(...arguments);
        }
      }
    `);
  });

  // https://github.com/decaffeinate/decaffeinate/issues/375
  it.skip('can be used as an argument to another call', () => {
    check(`
      class A
        b: ->
          c(super)
    `, `
      class A {
        b() {
          return c(super.b(...arguments));
        }
      }
    `);
  });
});
