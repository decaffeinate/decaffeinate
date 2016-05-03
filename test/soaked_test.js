import check from './support/check.js';

describe.skip('soaked expressions', () => {
  describe('function application', () => {
    it('works with a basic function', () => {
      check(`
        a?()
      `, `
        if (typeof a === 'function') { a(); }
      `);
    });

    it('works with a function that is not safe to repeat', () => {
      check(`
        a()?()
      `, `
        let fn;
        if (typeof (fn = a()) === 'function') { fn(); }
      `);
    });

    it('works in an expression context', () => {
      check(`
        a(b()?())
      `, `
        let fn;
        a(typeof (fn = b()) === 'function' ? fn() : undefined);
      `);
    });

    it('preserves arguments', () => {
        check(`
        a?(1, 2, 3)
      `, `
        if (typeof a === 'function') { a(1, 2, 3); }
      `);
    });

    it('combines conditions of nested soaked function calls', () => {
      check(`
        a?(1)?(2)
      `, `
        let fn;
        if (typeof a === 'function' && typeof (ref = a(1)) === 'function') { fn(2); }
      `);
    });

    it('works with dynamic member access as the function', () => {
      check(`
        a[b]?()
      `, `
        if (typeof a[b] === 'function') { a[b](); }
      `);
    });

    it('works with dynamic member access whose key is unsafe to repeat as the function', () => {
      check(`
        a[b()]?()
      `, `
        let fn;
        if (typeof (fn = a[b()]) === 'function') { fn(); }
      `);
    });
  });

  describe('soaked member access', () => {
    it('turns soaked member access assignment into an `if` statement', () => {
      check(`
        canvasContext?.font = $('body').css('font')
      `, `
        if (typeof canvasContext !== 'undefined' && canvasContext !== null) { canvasContext.font = $('body').css('font'); }
      `);
    });

    it('turns soaked member access assignment expressions into a ternary expression', () => {
      check(`
        a(b?.c = d)
      `, `
        a(typeof b !== 'undefined' && b !== null ? b.c = d : undefined);
      `);
    });

    it('converts soaked member access to a conditional', () => {
      check(`
        a?.b()
      `, `
        if (typeof a !== 'undefined' && a !== null) { a.b(); }
      `);
    });

    it('converts a complex soaked member access to a conditional with an assignment in the condition', () => {
      check(`
        a.b()?.c
      `, `
        let base;
        if ((base = a.b()) != null) { base.c; }
      `);
    });

    it('allows soaked member access to be used in an expression', () => {
      check(`
        a(b?.c)
      `, `
        a(typeof b !== 'undefined' && b !== null ? b.c : undefined));
      `);
    });

    it('converts dynamic soaked member access to a conditional', () => {
      check(`
        a?[b]()
      `, `
        if (typeof a !== 'undefined' && a !== null) { a[b](); }
      `);
    });

    it('wraps soaked member access if necessary', () => {
      // FIXME: Ideally this would be `if (typeof a !== 'undefined' && a !== null && a.b) { c; }`
      check(`
        if a?.b then c
      `, `
        if (typeof a !== 'undefined' && a !== null ? a.b : undefined) { c; }
      `);
    });

    it('combines conditions of nested soaks', () => {
      check(`
        a?.b?.c = 0;
      `, `
        if (typeof a !== 'undefined' && a !== null && a.b != null) { a.b.c = 0; }
      `);
    });
  });
  
  it('combines conditions of soaked function calls and soaked member accesses', () => {
    check(`
      a(1)?.b?()?[c]?.d = 1
    `, `
      let base;
      let base1;
      if ((base = a(1)) != null && typeof base.b === 'function' && (base1 = base.b()) != null && (base2 = base1[c]) != null) { base1.d = 1; }
    `);
  });
});
