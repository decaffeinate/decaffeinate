import check from './support/check.js';

describe('classes', () => {
  it('converts named classes without bodies', () => {
    check(`class A`, `class A {}`);
  });

  it('converts anonymous classes without bodies wrapped in parentheses', () => {
    check(`class`, `(class {});`);
  });

  it('converts anonymous classes with bodies', () => {
    check(`
      Animal = class
        a: ->
          1
    `, `
      let Animal = class {
        a() {
          return 1;
        }
      };
    `);
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
    // FIXME: Ideally the semi-colon would be directly after the closing curly.
    // This is due to an edge case that esnext chose not to address in its
    // `functions.arrow` plugin.
    check(`
      ->
        class A
          a: ->
            1
    `, `
      () =>
        class A {
          a() {
            return 1;
          }
        }
      ;
    `);
  });
  it('preserves class body generator functions as generator method definitions', () => {
    check(`
      class A
        'a a': ->
          yield 1
    `, `
      class A {
        *['a a']() {
          return yield 1;
        }
      }
    `);
  });

  it('preserves anonymous subclasses', () => {
    check(`
      class extends Parent
        constructor: ->
    `, `
      (class extends Parent {
        constructor() {}
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

  describe('assign properties from method parameters', () => {
    it('constructor without function body', () => {
      check(`
        class A
          constructor: ([@a = 1], {test: @b = 2}, @c) ->
      `, `
        class A {
          constructor([a = 1], {test: b = 2}, c) {
            this.a = a;
            this.b = b;
            this.c = c;
          }
        }
      `);
    });

    it('constructor with function body', () => {
      check(`
        class A
          constructor: (@a) ->
      `, `
        class A {
          constructor(a) {
            this.a = a;
          }
        }
      `);
    });

    it('method', () => {
      check(`
        class A
          method: (@a) ->
      `, `
        class A {
          method(a) {
            this.a = a;
          }
        }
      `);
    });

    it('bound method', () => {
      check(`
        class A
          method: (@a) =>
      `, `
        class A {
          constructor() {
            this.method = this.method.bind(this);
          }
        
          method(a) {
            this.a = a;
          }
        }
      `);
    });

    it('chooses variables that do not conflict', () => {
      check(`
        (@a) ->
          a = 1
      `, `
        (function(a1) {
          let a;
          this.a = a1;
          return a = 1;
        });
      `);
    });

    it('prepends assignments in single-line methods', () => {
      check(`
        class A
          member: (@a) -> console.log(@a)
      `, `
        class A {
          member(a) { this.a = a; return console.log(this.a); }
        }
      `);
    });

    it('handles property assignment parameter with default', () => {
      check(`
        (@a = 1) ->
      `, `
        (function(a = 1) {
          this.a = a;
        });
      `);
    });

    it('handles destructured property assignment parameters', () => {
      check(`
        ({@a}) ->
      `, `
        (function({a}) {
          this.a = a;
        });
      `);
    });

    it('handles named destructured property assignment parameters', () => {
      check(`
        ({a: @b}) ->
      `, `
        (function({a: b}) {
          this.b = b;
        });
      `);
    });

    it('uses correct value for default param when using another member', () => {
      check(`
        (@a, b = @c) ->
      `, `
        (function(a, b = this.c) {
          this.a = a;
        });
      `);
    });

    it.skip('uses correct value for default param when reusing an already implicitly assigned param', () => {
      check(`
        (@a, b = @a) ->
      `, `
        (function(a, b = a) {
          this.a = a;
        });
      `);
    });
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
        static initClass() {
          this.prototype.b = 1;
        }
      }
      A.initClass();
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

  it('handles class properties', () => {
    check(`
      class A
        setup: _.once () ->
    `, `
      class A {
        static initClass() {
          this.prototype.setup = _.once(function() {});
        }
      }
      A.initClass();
    `);
  });

  it('creates a constructor for bound methods with a `super` call in extended classes', () => {
    check(`
      class A extends B
        a: =>
          1
    `, `
      class A extends B {
        constructor(...args) {
          super(...args);
          this.a = this.a.bind(this);
        }

        a() {
          return 1;
        }
      }
    `);
  });

  it('handles bound methods with parameters', () => {
    check(`
      class a
        b: (c) =>
    `, `
      class a {
        constructor() {
          this.b = this.b.bind(this);
        }

        b(c) {}
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

  it('adds to an existing constructor for bound methods after a `super` call', () => {
    check(`
      class A extends B
        a: =>
          1

        constructor: ->
          super()
          this.b = 2;
    `, `
      class A extends B {
        a() {
          return 1;
        }

        constructor() {
          super();
          this.a = this.a.bind(this);
          this.b = 2;
        }
      }
    `);
  });

  it('converts `super` inside non-constructor methods to a named lookup', () => {
    check(`
      class A extends B
        a: ->
          super
    `, `
      class A extends B {
        a() {
          return super.a(...arguments);
        }
      }
    `);
  });

  it('converts `super` with args inside non-constructor methods to a named lookup', () => {
    check(`
      class A extends B
        a: ->
          super 1, 2
    `, `
      class A extends B {
        a() {
          return super.a(1, 2);
        }
      }
    `);
  });

  it('converts `super` inside static methods to a named lookup', () => {
    check(`
      class A extends B
        @a: ->
          super
    `, `
      class A extends B {
        static a() {
          return super.a(...arguments);
        }
      }
    `);
  });

  it('converts shorthand-this static methods correctly', () => {
    check(`
      class A
        @a: ->
          1
    `, `
      class A {
        static a() {
          return 1;
        }
      }
    `);
  });

  it('converts longhand-this static methods correctly', () => {
    check(`
      class A
        this.a = ->
          1
    `, `
      class A {
        static a() {
          return 1;
        }
      }
    `);
  });

  it('converts longhand static methods correctly', () => {
    check(`
      class A
        A.a = ->
          1
    `, `
      class A {
        static a() {
          return 1;
        }
      }
    `);
  });

  it('converts member expression class names correctly', () => {
    check(`
      class A.B
        a: -> 1
    `, `
      A.B = class B {
        a() { return 1; }
      };
    `);
  });

  it('converts dynamic member expression class names correctly', () => {
    check(`
      class A[B]
        a: -> 1
    `, `
      A[B] = class {
        a() { return 1; }
      };
    `);
  });

  it('converts instance properties with multi-line object values correctly', () => {
    check(`
      class A
        a:
          b: c
          d: e
    `, `
      class A {
        static initClass() {
          this.prototype.a = {
            b: c,
            d: e
          };
        }
      }
      A.initClass();
    `);
  });

  it('handles code in class bodies', () => {
    check(`
      class A
        doThing()
        a: ->
          3
        doOtherThing()
        b: ->
          7
    `, `
      class A {
        static initClass() {
          doThing();
          doOtherThing();
        }
        a() {
          return 3;
        }
        b() {
          return 7;
        }
      }
      A.initClass();
    `);
  });

  it('handles variables used within the class', () => {
    check(`
      class A
        x = 3
        a: ->
          x + 1
    `, `
      let x = undefined;
      class A {
        static initClass() {
          x = 3;
        }
        a() {
          return x + 1;
        }
      }
      A.initClass();
    `);
  });

  it('handles class body code when the class has a superclass', () => {
    check(`
      class A extends B
        x: 3
    `, `
      class A extends B {
        static initClass() {
          this.prototype.x = 3;
        }
      }
      A.initClass();
    `);
  });

  it('handles assigning values to the constructor', () => {
    check(`
      class A
        @x: 3
    `, `
      class A {
        static initClass() {
          this.x = 3;
        }
      }
      A.initClass();
    `);
  });

  it('handles nested classes', () => {
    check(`
      class A
        class B
          classField: 2
          x: ->
            return 3
        class C
          CONSTANT = 7
          y: ->
            return 4
        makeB: ->
          new B()
        makeC: ->
          new C()
    `, `
      let B = undefined;
      let C = undefined;
      class A {
        static initClass() {
          B = class B {
            static initClass() {
              this.prototype.classField = 2;
            }
            x() {
              return 3;
            }
          };
          B.initClass();
          let CONSTANT = undefined;
          C = class C {
            static initClass() {
              CONSTANT = 7;
            }
            y() {
              return 4;
            }
          };
          C.initClass();
        }
        makeB() {
          return new B();
        }
        makeC() {
          return new C();
        }
      }
      A.initClass();
    `);
  });

  it('handles an equals-style constructor assignment with a colon in the body', () => {
    check(`
      class A
        @values =
          'A': 1
          'B': 2
    `, `
      class A {
        static initClass() {
          this.values = {
            'A': 1,
            'B': 2
          };
        }
      }
      A.initClass();
    `);
  });
});
