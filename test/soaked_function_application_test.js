import check from './support/check';

describe('soaked function application', () => {
  it('works with a basic function', () => {
    check(`
      a?()
    `, `
      if (typeof a === "function") { a(); }
    `);
  });

  it('works with a function that is not safe to repeat', () => {
    check(`
      a()?()
    `, `
      var fn;
      if (typeof (fn = a()) === "function") { fn(); }
    `);
  });

  it('works in an expression context', () => {
    check(`
      a(b()?())
    `, `
      var fn;
      a(typeof (fn = b()) === "function" ? fn() : undefined);
    `);
  });

  it('works with arguments', () => {
    check(`
      a?(1, 2, 3)
    `, `
      if (typeof a === "function") { a(1, 2, 3); }
    `);
  });

  it('works with chains', () => {
    check(`
      a?()?()
    `, `
      var fn;
      if (typeof (fn = typeof a === "function" ? a() : undefined) === "function") { fn(); }
    `);
  });

  it('works with dynamic member access as the function', () => {
    check(`
      a[b]?()
    `, `
      if (typeof a[b] === "function") { a[b](); }
    `);
  });

  it('works with dynamic member access whose key is unsafe to repeat as the function', () => {
    check(`
      a[b()]?()
    `, `
      var fn;
      if (typeof (fn = a[b()]) === "function") { fn(); }
    `);
  });
});
