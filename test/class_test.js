import check from './support/check';

describe('classes', () => {
  it('converts named classes without bodies', () => {
    check(`class A`, `class A {}`);
  });

  it('converts anonymous classes without bodies wrapped in parentheses', () => {
    check(`class`, `(class {});`);
  });

  it('preserves class body functions as method definitions', () => {
    check(`
      class A
        a: ->
          1
    `, `
      class A {
        a() {
          return 1;
        }
      }
    `);
    check(`
      ->
        class A
          a: ->
            1
    `, `
      (function() {
        return class A {
          a() {
            return 1;
          }
        };
      });
    `);
  });

  it('preserves class constructors without arguments', () => {
    check(`
      class A
        constructor: ->
          @a = 1
    `, `
      class A {
        constructor() {
          this.a = 1;
        }
      }
    `);
  });

  it('preserves class constructors with arguments', () => {
    check(`
      class A
        constructor: (a) ->
          @a = a
    `, `
      class A {
        constructor(a) {
          this.a = a;
        }
      }
    `);
  });

  it('preserves class constructors extending superclasses', () => {
    check(`
      class A extends B
        constructor: ->
    `, `
      class A extends B {
        constructor() {}
      }
    `);
  });

  it('preserves class constructors extending non-identifier superclasses', () => {
    check(`
      class A extends (class B extends C)
        constructor: ->
    `, `
      class A extends (class B extends C {}) {
        constructor() {}
      }
    `);
  });

  it('turns non-method properties into prototype assignments', () => {
    check(`
      class A
        b: 1
    `, `
      class A {
        b = 1;
      }
    `);
  });

  it('creates a constructor for bound methods', () => {
    check(`
      class A
        a: =>
          1
    `, `
      class A {
        constructor() {
          this.a = this.a.bind(this);
        }

        a() {
          return 1;
        }
      }
    `);
  });

  it('adds to an existing constructor for bound methods', () => {
    check(`
      class A
        a: =>
          1

        constructor: ->
          2
    `, `
      class A {
        a() {
          return 1;
        }

        constructor() {
          this.a = this.a.bind(this);
          2;
        }
      }
    `);
  });

  it.skip('creates a constructor with a super call for bound methods in a subclass', () => {
    // FIXME: CSR does not properly support `super` yet!
    // Check out this branch: https://github.com/michaelficarra/CoffeeScriptRedux/pull/313.
    check(`
      class A extends B
        a: =>
          1
    `, `
      class A extends B {
        constructor() {
          super();
          this.a = this.a.bind(this);
        }

        a() {
          return 1;
        }
      }
    `);
  });
});
