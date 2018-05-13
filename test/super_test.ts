import check, { checkCS1 } from './support/check';

describe('super', () => {
  it('spreads `arguments` when no arguments are given', () => {
    checkCS1(
      `
      class C extends B
        constructor: (x) ->
          super

        fn: (x) ->
          super
    `,
      `
      class C extends B {
        constructor(x) {
          super(...arguments);
        }

        fn(x) {
          return super.fn(...arguments);
        }
      }
    `
    );
  });

  // https://github.com/decaffeinate/decaffeinate/issues/375
  it('can be used as an argument to another call', () => {
    checkCS1(
      `
      class A
        b: ->
          c(super)
    `,
      `
      class A {
        b() {
          return c(super.b(...arguments));
        }
      }
    `
    );
  });

  it('allows super within a class assigned to a variable', () => {
    checkCS1(
      `
      A = class extends B
        f: ->
          super
    `,
      `
      const A = class extends B {
        f() {
          return super.f(...arguments);
        }
      };
    `
    );
  });

  it('allows super within a method assignment with a property access class', () => {
    checkCS1(
      `
      a.b.prototype.c = -> super
    `,
      `
      let cls;
      (cls = a.b).prototype.c = function() { return cls.prototype.__proto__.c.call(this, ...arguments); };
    `
    );
  });

  it('allows super within a method assignment with a computed class', () => {
    checkCS1(
      `
      a().prototype.b = -> super
    `,
      `
      let cls;
      (cls = a()).prototype.b = function() { return cls.prototype.__proto__.b.call(this, ...arguments); };
    `
    );
  });

  it('allows super within a dynamic prototype member access', () => {
    checkCS1(
      `
      A().prototype[b()] = ->
        super
    `,
      `
      let cls, method;
      (cls = A()).prototype[method = b()] = function() {
        return cls.prototype.__proto__[method].call(this, ...arguments);
      };
    `
    );
  });

  it('does not mark a proto assign as repeatable if the method does not call super', () => {
    check(
      `
      A().prototype[b()] = ->
        3
    `,
      `
      A().prototype[b()] = () => 3;
    `
    );
  });

  it('allows super on a method with a non-identifier name', () => {
    checkCS1(
      `
      class A
        0: -> super
    `,
      `
      class A {
        0() { return super[0](...arguments); }
      }
    `
    );
  });

  it('allows super on a method with a non-repeatable computed name', () => {
    checkCS1(
      `
      class A
        "#{b()}": -> super
    `,
      `
      let method;
      class A {
        [method = b()]() { return super[method](...arguments); }
      }
    `
    );
  });
});
