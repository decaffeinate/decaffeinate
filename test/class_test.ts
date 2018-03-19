import assertError from './support/assertError';
import check, {checkCS1, checkCS2} from './support/check';
import validate, {validateCS1} from './support/validate';

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
      const Animal = class {
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
        class
          a: ->
            1
    `, `
      () =>
        class {
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
        *'a a'() {
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
    `, {
      options: {
        disableBabelConstructorWorkaround: true,
      }
    });
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
      checkCS1(`
        class A
          constructor: ([@a = 1], {test: @b = 2}, @c) ->
      `, `
        class A {
          constructor(...args) {
            let array, obj, val, val1;
            array = args[0],
              val = array[0],
              this.a = val != null ? val : 1,
              obj = args[1],
              val1 = obj.test,
              this.b = val1 != null ? val1 : 2,
              this.c = args[2];
          }
        }
      `);
      checkCS2(`
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

    it('errors when specified when using this before super in a constructor', () => {
      assertError(`
        class A extends B
          constructor: ->
            @a = 2
            super
      `,
        'Cannot automatically convert a subclass with a constructor that uses `this` before `super`.',
        {
          disallowInvalidConstructors: true,
        });
    });

    it('does not error when using `this` in a function before `super` in a constructor', () => {
      checkCS1(`
        class A extends B
          constructor: ->
            f = -> @a = 2
            super
            f()
      `, `
        class A extends B {
          constructor() {
            const f = function() { return this.a = 2; };
            super(...arguments);
            f();
          }
        }
      `);
    });

    it('errors when specified when a subclass constructor omits super', () => {
      assertError(`
        class A extends B
          constructor: ->
            @a = 2
      `,
        'Cannot automatically convert a subclass with a constructor that does not call super.',
        {
          disallowInvalidConstructors: true,
        });
    });

    it('errors when specified when a subclass uses a bound method', () => {
      assertError(`
      class A extends B
        a: =>
          1
    `,
        'Cannot automatically convert a subclass that uses bound methods.',
        {
          disallowInvalidConstructors: true,
        });
    });

    it('errors when specified with an existing constructor and bound methods in a subclass', () => {
      assertError(`
      class A extends B
        a: =>
          1

        constructor: ->
          super()
          this.b = 2;
    `,
        'Cannot automatically convert a subclass that uses bound methods.',
        {
          disallowInvalidConstructors: true,
        });
    });

    it('disables the babel workaround when using this before super in a constructor', () => {
      checkCS1(`
        class A extends B
          constructor: ->
            @a = 2
            super
      `, `
        class A extends B {
          constructor() {
            this.a = 2;
            super(...arguments);
          }
        }
      `, {
        options: {
          disableBabelConstructorWorkaround: true,
        }
      });
    });

    it('disables the babel workaround when a subclass constructor omits super', () => {
      check(`
        class A extends B
          constructor: ->
            @a = 2
      `, `
        class A extends B {
          constructor() {
            this.a = 2;
          }
        }
      `, {
        options: {
          disableBabelConstructorWorkaround: true,
        }
      });
    });

    it('creates a constructor for bound methods with a `super` call in extended classes when requested', () => {
      check(`
      class A extends B
        a: =>
          1
    `, `
      class A extends B {
        constructor(...args) {
          this.a = this.a.bind(this);
          super(...args);
        }

        a() {
          return 1;
        }
      }
    `, {
        options: {
          disableBabelConstructorWorkaround: true,
        }
      });
    });

    it('adds to an existing constructor for bound methods before a `super` call when requested', () => {
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
          this.a = this.a.bind(this);
          super();
          this.b = 2;
        }
      }
    `, {
        options: {
          disableBabelConstructorWorkaround: true,
        }
      });
    });

    it('generates workaround code when using this before super in a constructor', () => {
      checkCS1(`
        class A extends B
          constructor: ->
            @a = 2
            super
      `, `
        class A extends B {
          constructor() {
            {
              // Hack: trick Babel/TypeScript into allowing this before super.
              if (false) { super(); }
              let thisFn = (() => { this; }).toString();
              let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
              eval(\`\${thisName} = this;\`);
            }
            this.a = 2;
            super(...arguments);
          }
        }
      `);
    });

    it('generates workaround code when a subclass constructor omits super', () => {
      check(`
        class A extends B
          constructor: ->
            @a = 2
      `, `
        class A extends B {
          constructor() {
            {
              // Hack: trick Babel/TypeScript into allowing this before super.
              if (false) { super(); }
              let thisFn = (() => { this; }).toString();
              let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
              eval(\`\${thisName} = this;\`);
            }
            this.a = 2;
          }
        }
      `);
    });

    it('generates workaround code when a subclass has a bound method and no constructor', () => {
      check(`
        class A extends B
          foo: =>
            null
      `, `
        class A extends B {
          constructor(...args) {
            {
              // Hack: trick Babel/TypeScript into allowing this before super.
              if (false) { super(); }
              let thisFn = (() => { this; }).toString();
              let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
              eval(\`\${thisName} = this;\`);
            }
            this.foo = this.foo.bind(this);
            super(...args);
          }
        
          foo() {
            return null;
          }
        }
      `);
    });

    it('generates workaround code when a subclass has a bound method and a normal constructor', () => {
      checkCS1(`
        class A extends B
          constructor: ->
            super
            @x = 3
        
          foo: =>
            null
      `, `
        class A extends B {
          constructor() {
            {
              // Hack: trick Babel/TypeScript into allowing this before super.
              if (false) { super(); }
              let thisFn = (() => { this; }).toString();
              let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
              eval(\`\${thisName} = this;\`);
            }
            this.foo = this.foo.bind(this);
            super(...arguments);
            this.x = 3;
          }
        
          foo() {
            return null;
          }
        }
      `);
    });

    it('generates workaround code when a subclass has a bound method and an empty constructor', () => {
      check(`
        class A extends B
          constructor: ->
        
          foo: =>
            null
      `, `
        class A extends B {
          constructor() {
            {
              // Hack: trick Babel/TypeScript into allowing this before super.
              if (false) { super(); }
              let thisFn = (() => { this; }).toString();
              let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
              eval(\`\${thisName} = this;\`);
            }
            this.foo = this.foo.bind(this);
          }
        
          foo() {
            return null;
          }
        }
      `);
    });

    it('does not generate workaround code when the workaround is unnecessary', () => {
      checkCS1(`
        class A extends B
          constructor: ->
            super
            @x = 3
      `, `
        class A extends B {
          constructor() {
            super(...arguments);
            this.x = 3;
          }
        }
      `);
    });

    it('properly generates workaround code when constructors have default parameters', () => {
      checkCS1(`
        class A extends B
          constructor: (c={}) ->
            @d = e
            super
      `, `
        class A extends B {
          constructor(c) {
            {
              // Hack: trick Babel/TypeScript into allowing this before super.
              if (false) { super(); }
              let thisFn = (() => { this; }).toString();
              let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
              eval(\`\${thisName} = this;\`);
            }
            if (c == null) { c = {}; }
            this.d = e;
            super(...arguments);
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
        (function(a) {
          if (a == null) { a = 1; }
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
        (function(a, b) {
          this.a = a;
          if (b == null) { b = this.c; }
        });
      `);
    });

    it('uses correct value for default param with loose params when using another member', () => {
      check(`
        (@a, b = @c) ->
      `, `
        (function(a, b = this.c) {
          this.a = a;
        });
      `, {
        options: {
          looseDefaultParams: true
        }
      });
    });

    it('uses correct value for default param when reusing an already implicitly assigned param', () => {
      check(`
        (@a, b = @a) ->
      `, `
        (function(a, b) {
          this.a = a;
          if (b == null) { b = this.a; }
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
    `, {
      options: {
        disableBabelConstructorWorkaround: true,
      }
    });
  });

  it('preserves class constructors extending non-identifier superclasses', () => {
    check(`
      class A extends (class B extends C)
        constructor: ->
    `, `
      let B;
      class A extends (B = class B extends C {}) {
        constructor() {}
      }
    `, {
      options: {
        disableBabelConstructorWorkaround: true,
      }
    });
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

  it('converts `super` inside non-constructor methods to a named lookup', () => {
    checkCS1(`
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
    checkCS1(`
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
      var A = (function() {
        let x = undefined;
        A = class A {
          static initClass() {
            x = 3;
          }
          a() {
            return x + 1;
          }
        };
        A.initClass();
        return A;
      })();
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
      var A = (function() {
        let B = undefined;
        let C = undefined;
        A = class A {
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
            C = (function() {
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
              return C;
            })();
          }
          makeB() {
            return new B();
          }
          makeC() {
            return new C();
          }
        };
        A.initClass();
        return A;
      })();
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

  it('handles a bound method and an implicit super in the constructor', () => {
    checkCS1(`
      class X extends Y
        constructor: ->
          super
      
        add: =>
    `, `
      class X extends Y {
        constructor() {
          this.add = this.add.bind(this);
          super(...arguments);
        }
      
        add() {}
      }
    `, {
      options: {
        disableBabelConstructorWorkaround: true,
      }
    });
  });

  it('handles a bound method and an empty constructor', () => {
    check(`
      class X
        constructor: ->
      
        add: =>
    `, `
      class X {
        constructor() {
          this.add = this.add.bind(this);
        }
      
        add() {}
      }
    `);
  });

  it('handles a bound method and an empty constructor with a parameter', () => {
    check(`
      class X
        constructor: (a, b) ->
      
        add: =>
    `, `
      class X {
        constructor(a, b) {
          this.add = this.add.bind(this);
        }
      
        add() {}
      }
    `);
  });

  it('places method bindings at the start of the constructor even if there is a super call', () => {
    checkCS1(`
      class X extends Y
        constructor: ->
          if a
            b
          super
          if c
            d
      
        add: =>
    `, `
      class X extends Y {
        constructor() {
          this.add = this.add.bind(this);
          if (a) {
            b;
          }
          super(...arguments);
          if (c) {
            d;
          }
        }
      
        add() {}
      }
    `, {
      options: {
        disableBabelConstructorWorkaround: true,
      }
    });
  });

  it('places method bindings at the start of the constructor if there is no super', () => {
    check(`
      class X
        constructor: ->a
      
        add: =>
    `, `
      class X {
        constructor() { this.add = this.add.bind(this);   a; }
      
        add() {}
      }
    `);
  });

  it('handles a default constructor parameter and a bound method', () => {
    check(`
      class Nukes
        constructor: (y = 'foo') ->
        launch: (x) => true
    `, `
      class Nukes {
        constructor(y) {
          this.launch = this.launch.bind(this);
          if (y == null) { y = 'foo'; }
        }
        launch(x) { return true; }
      }
    `);
  });

  it('handles a single-line class', () => {
    check(`
      class A then b: -> c
    `, `
      class A {
        b() { return c; }
      }
    `);
  });

  it('handles a single-line class that needs an initClass method', () => {
    check(`
      class A then b: c
    `, `
      class A {
        static initClass() {
          this.prototype.b = c;
        }
      }
      A.initClass();
    `);
  });

  it('handles a single-line class with an external constructor', () => {
    check(`
      f = ->
      class A then constructor: f
    `, `
      const f = function() {};
      let createA = undefined;
      class A {
        static initClass() {
          createA = f;
        }
        constructor() {
          return createA.apply(this, arguments);
        }
      }
      A.initClass();
    `);
  });

  it('allows super calls within nested functions', () => {
    check(`
      class B extends A
        foo : (cb) ->
          dolater =>
            dolater =>
              super cb
    `, `
      class B extends A {
        foo(cb) {
          return dolater(() => {
            return dolater(() => {
              return B.prototype.__proto__.foo.call(this, cb);
            });
          });
        }
      }
    `);
  });

  it('handles a super call on a method assigned directly to the prototype', () => {
    checkCS1(`
      class A
        c: -> console.log 'Hello'
      class B extends A
      B::c = -> super
      b = new B()
      b.c()
    `, `
      let cls;
      class A {
        c() { return console.log('Hello'); }
      }
      class B extends A {}
      (cls = B).prototype.c = function() { return cls.prototype.__proto__.c.call(this, ...arguments); };
      const b = new B();
      b.c();
    `);
  });

  it('has correct behavior with a standalone prototype super call', () => {
    validateCS1(`
      class A
        c: -> 3
      class B extends A
      B::c = -> super + 1
      b = new B()
      setResult(b.c())
    `, 4);
  });

  it('forwards function arguments on empty super, even if the arguments are for an inner function', () => {
    validateCS1(`
      class A
        c: (x) -> x + 5
      class B extends A
        c: (x) ->
          f = (y) ->
            super
          f(x + 3)
      b = new B()
      setResult(b.c(1))
    `, 9);
  });

  it('handles a complex anonymous class in an expression context', () => {
    check(`
      A = class
        b: c
    `, `
      const A = (function() {
        const Cls = class {
          static initClass() {
            this.prototype.b = c;
          }
        };
        Cls.initClass();
        return Cls;
      })();
    `);
  });

  it('handles a complex anonymous class with a variable in an expression context', () => {
    check(`
      A = class
        b: c
        d = e
    `, `
      const A = (function() {
        let d = undefined;
        const Cls = class {
          static initClass() {
            this.prototype.b = c;
            d = e;
          }
        };
        Cls.initClass();
        return Cls;
      })();
    `);
  });

  it('generates an assignment for a named class in an expression context', () => {
    check(`
      A = class B
    `, `
      let B;
      const A = (B = class B {});
    `);
  });

  it('generates an assignment for a complex named class in an expression context', () => {
    check(`
      A = class B
        c: d
    `, `
      let B;
      const A = (B = (function() {
        B = class B {
          static initClass() {
            this.prototype.c = d;
          }
        };
        B.initClass();
        return B;
      })());
    `);
  });

  it('has the proper runtime behavior for a named class in an expression context', () => {
    validate(`
      A = class B
      setResult(B.name)
    `, 'B');
  });

  it('handles a class expression in an implicit return context', () => {
    check(`
      f = ->
        class A
          b: c
    `, `
      const f = function() {
        let A;
        return A = (function() {
          A = class A {
            static initClass() {
              this.prototype.b = c;
            }
          };
          A.initClass();
          return A;
        })();
      };
    `);
  });

  it('handles a define call ending in a class (#625)', () => {
    check(`
      define (require) ->
        'use strict'
        
        class MainLayout extends BaseView
          container: 'body'
    `, `
      define(function(require) {
        'use strict';
        
        let MainLayout;
        return MainLayout = (function() {
          MainLayout = class MainLayout extends BaseView {
            static initClass() {
              this.prototype.container = 'body';
            }
          };
          MainLayout.initClass();
          return MainLayout;
        })();
      });
    `);
  });

  it('handles an inner class with a this-assignment', () => {
    check(`
      class Outer
        class @Inner
    `, `
      class Outer {
        static initClass() {
          this.Inner = class Inner {};
        }
      }
      Outer.initClass();
    `);
  });

  it('handles a class this-assigned to a keyword name', () => {
    check(`
      ->
        class @for
    `, `
      (function() {
        return (this.for = class _for {});
      });
    `);
  });

  it('allows an external constructor for a simple class', () => {
    check(`
      f = -> @x = 3
      class A
        constructor: f
    `, `
      const f = function() { return this.x = 3; };
      let createA = undefined;
      class A {
        static initClass() {
          createA = f;
        }
        constructor() {
          return createA.apply(this, arguments);
        }
      }
      A.initClass();
    `);
  });

  it('allows external constructors with bound methods', () => {
    check(`
      fn = ->
      class A
        constructor: fn
        method: =>
    `, `
      const fn = function() {};
      let createA = undefined;
      class A {
        static initClass() {
          createA = fn;
        }
        constructor() {
          this.method = this.method.bind(this);
          return createA.apply(this, arguments);
        }
        method() {}
      }
      A.initClass();
    `);
  });

  it('allows simple computed keys for class methods', () => {
    check(`
      class A
        "#{f()}": -> 'Hello'
    `, `
      class A {
        [f()]() { return 'Hello'; }
      }
    `);
  });

  it('allows string interpolation keys for class methods', () => {
    check(`
      class A
        "#{f()}, World": -> 'Hello'
    `, `
      class A {
        [\`\${f()}, World\`]() { return 'Hello'; }
      }
    `);
  });

  it('allows two class declarations with the same name', () => {
    check(`
      class A
      class A
    `, `
      class A {}
      A = class A {};
    `);
  });

  it('assigns the right name to a normal class constructor', () => {
    validate(`
      class A
      setResult(A.name)
    `, 'A');
  });

  it('assigns the right name to a class constructor for a property access', () => {
    validate(`
      A = {}
      class A.B
      setResult(A.B.name)
    `, 'B');
  });

  it('assigns the right name to a class constructor for a keyword', () => {
    validate(`
      A = {}
      class A.for
      setResult(A.for.name)
    `, '_for');
  });

  it('does not modify the constructor name for a CoffeeScript keyword', () => {
    validate(`
      A = {}
      class A.or
      setResult(A.or.name)
    `, 'or');
  });

  it('allows bound methods with non-identifier names that can be simplified', () => {
    check(`
      class A
        "#{b}": => c
    `, `
      class A {
        constructor() {
          this[b] = this[b].bind(this);
        }
      
        [b]() { return c; }
      }
    `);
  });

  it('allows bound methods with complex non-identifier names', () => {
    check(`
      class A
        "#{b}foo": => c
    `, `
      class A {
        constructor() {
          this[\`\${b}foo\`] = this[\`\${b}foo\`].bind(this);
        }
      
        [\`\${b}foo\`]() { return c; }
      }
    `);
  });

  it('allows bound methods with non-identifier names that can be simplified with an existing constructor', () => {
    check(`
      class A
        constructor: ->
          console.log 'got here'
      
        "#{b}": => c
    `, `
      class A {
        constructor() {
          this[b] = this[b].bind(this);
          console.log('got here');
        }
      
        [b]() { return c; }
      }
    `);
  });

  it('allows bound methods with complex non-identifier names with an existing constructor', () => {
    check(`
      class A
        constructor: ->
          console.log 'got here'
      
        "#{b}foo": => c
    `, `
      class A {
        constructor() {
          this[\`\${b}foo\`] = this[\`\${b}foo\`].bind(this);
          console.log('got here');
        }
      
        [\`\${b}foo\`]() { return c; }
      }
    `);
  });

  it('allows patching within an external constructor expression', () => {
    check(`
      makeCtor = ->
      class B
        constructor: makeCtor 1
    `, `
      const makeCtor = function() {};
      let createB = undefined;
      class B {
        static initClass() {
          createB = makeCtor(1);
        }
        constructor() {
          return createB.apply(this, arguments);
        }
      }
      B.initClass();
    `);
  });

  it('handles a complex anonymous class in a statement context', () => {
    check(`
      class
        x: 1
    `, `
      const Cls = class {
        static initClass() {
          this.prototype.x = 1;
        }
      };
      Cls.initClass();
    `);
  });

  it('handles inconsistent indentation in an expression-style complex class', () => {
    check(`
      x = class A
        constructor: ->
          b
         c: ->
           d
        e: f
    `, `
      let A;
      const x = (A = (function() {
        A = class A {
          static initClass() {
            this.prototype.e = f;
          }
          constructor() {
            b;
          }
          c() {
             return d;
           }
        };
        A.initClass();
        return A;
      })());
    `);
  });

  it('handles an inline class with comma-separated fields (#544)', () => {
    check(`
      rethinkdb.monday = new (class extends RDBConstant then tt: protoTermType.MONDAY, st: 'monday')()
    `, `
      rethinkdb.monday = new ((function() {
        const Cls = (class extends RDBConstant {
          static initClass() {
            this.prototype.tt = protoTermType.MONDAY; this.prototype.st = 'monday';
            
          }
        });
        Cls.initClass();
        return Cls();
      })());
    `);
  });

  it('handles new directly called on a class', () => {
    check(`
      new class A
    `, `
      let A;
      new (A = class A {});
    `);
  });

  it('handles an expression-style class ending in a comment', () => {
    check(`
      x = class A
        b: ->
          c # d
    `, `
      let A;
      const x = (A = class A {
        b() {
          return c; // d
        }
      });
    `);
  });

  it('properly handles bound static methods', () => {
    check(`
      class A
        @b = =>
          @c
    `, `
      class A {
        static initClass() {
          this.b = () => {
            return this.c;
          };
        }
      }
      A.initClass();
    `);
  });

  it('has the right behavior with bound static methods', () => {
    validate(`
      class A
        @b = =>
          @c
        @c = 5
      
      b = A.b
      setResult(b())
    `, 5);
  });

  it('handles conditional prototype assignments', () => {
    check(`
      class A
        if b
          c: d
        else
          e: f
    `, `
      class A {
        static initClass() {
          if (b) {
            this.prototype.c = d;
          } else {
            this.prototype.e = f;
          }
        }
      }
      A.initClass();
    `);
  });

  it('handles conditional methods', () => {
    check(`
      class A
        if b
          c: -> d
        else
          e: -> f
    `, `
      class A {
        static initClass() {
          if (b) {
            this.prototype.c = () => d;
          } else {
            this.prototype.e = () => f;
          }
        }
      }
      A.initClass();
    `);
  });

  it('saves the method name for dynamic prototype method assignments', () => {
    checkCS1(`
      A::[m] = -> super
    `, `
      let cls, method;
      (cls = A).prototype[method = m] = function() { return cls.prototype.__proto__[method].call(this, ...arguments); };
    `);
  });

  it('behaves correctly for dynamic prototype method assignments', () => {
    validateCS1(`
      class Base
        f: -> 1
        g: -> 2
      class A extends Base
      m = 'f'
      A::[m] = -> super
      m = 'g'
      setResult((new A).f())
    `, 1);
  });

  it('generates proper class accesses in super used in initClass', () => {
    checkCS1(`
      class A extends B
        @::f = -> super
    `, `
      class A extends B {
        static initClass() {
          let cls;
          (cls = this).prototype.f = function() { return cls.prototype.__proto__.f.call(this, ...arguments); };
        }
      }
      A.initClass();
    `);
  });

  it('properly saves the method name for computed methods using super', () => {
    checkCS1(`
      class A extends B
        "#{m}": -> super
    `, `
      let method;
      class A extends B {
        [method = m]() { return super[method](...arguments); }
      }
    `);
  });

  it('handles dynamically-added methods using super on other classes added within class bodies', () => {
    checkCS1(`
      class A
        @b::m = -> super
    `, `
      class A {
        static initClass() {
          let cls;
          (cls = this.b).prototype.m = function() { return cls.prototype.__proto__.m.call(this, ...arguments); };
        }
      }
      A.initClass();
    `);
  });

  it('converts dynamically-named static methods properly', () => {
    check(`
      class A
        @[b] = -> 'hello'
    `, `
      class A {
        static [b]() { return 'hello'; }
      }
    `);
  });

  it('properly handles dynamic keys with static methods using super', () => {
    checkCS1(`
      class A extends B
        @[c] = -> super
    `, `
      let method;
      class A extends B {
        static [method = c]() { return super[method](...arguments); }
      }
    `);
  });

  it('properly handles static methods calling super from within initClass', () => {
    checkCS1(`
      class A extends B
        if a
          @b = -> super
    `, `
      class A extends B {
        static initClass() {
          if (a) {
            let cls;
            (cls = this).b = function() { return cls.__proto__.b.call(this, ...arguments); };
          }
        }
      }
      A.initClass();
    `);
  });

  it('properly handles non-shorthand super in dynamically generated static methods', () => {
    check(`
      class A extends B
        if a
          @b = -> super(foo)
    `, `
      class A extends B {
        static initClass() {
          if (a) {
            let cls;
            (cls = this).b = function() { return cls.__proto__.b.call(this, foo); };
          }
        }
      }
      A.initClass();
    `);
  });

  it('properly handles static methods with dynamic names calling super from within initClass', () => {
    checkCS1(`
      class A extends B
        if a
          @[b] = -> super
    `, `
      class A extends B {
        static initClass() {
          if (a) {
            let cls, method;
            (cls = this)[(method = b)] = function() { return cls.__proto__[method].call(this, ...arguments); };
          }
        }
      }
      A.initClass();
    `);
  });

  it('behaves properly with conditionally assigned static methods with super', () => {
    validateCS1(`
      class A
        @a = -> 3
      class B extends A
        if true
          @a = -> super
      setResult(B.a())
    `, 3);
  });

  it('behaves properly with conditionally assigned static methods with a dynamic name with super', () => {
    validateCS1(`
      class A
        @a = -> 3
      m = 'a'
      class B extends A
        if true
          @[m] = -> super
      setResult(B.a())
    `, 3);
  });

  it('handles complex class expressions with trailing whitespace', () => {
    check(`
      A = class B
        c: d
        e: ->
          f 
      
    `, `
      let B;
      const A = (B = (function() {
        B = class B {
          static initClass() {
            this.prototype.c = d;
          }
          e() {
            return f;
          }
        };
        B.initClass();
        return B; 
      })());
      
    `, {shouldStripIndent: false});
  });
});
