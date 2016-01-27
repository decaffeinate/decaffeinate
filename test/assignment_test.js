import check from './support/check';

describe.only('assignment', () => {
  it('turns soaked member access assignment into an `if` statement', () => {
    check(`
      canvasContext?.font = $('body').css('font')
    `, `
      if ((typeof canvasContext !== "undefined" && canvasContext !== null)) { canvasContext.font = $('body').css('font'); }
    `);
  });

  it('turns soaked member access assignment expressions into a ternary expression', () => {
    check(`
      a(b?.c = d)
    `, `
      a((typeof b !== "undefined" && b !== null) ? b.c = d : undefined);
    `);
  });

  it('handles simple existence assignment', () => {
    check(`
      a = 1
      a ?= 2
    `, `
      var a = 1;
      if (!(typeof a !== "undefined" && a !== null)) { a = 2; }
    `);
  });

  it('handles simple member expression existence assignment', () => {
    check(`
      a.b ?= 1
    `, `
      if (!(a.b != null)) { a.b = 1; }
    `);
  });

  it('handles simple computed member expression existence assignment', () => {
    check(`
      a[b] ?= 1
    `, `
      if (!(a[b] != null)) { a[b] = 1; }
    `);
  });

  it('handles computed member expression existence assignment with unsafe-to-repeat key', () => {
    check(`
      a[b()] ?= 1
    `, `
      var name;
      if (!(a[name = b()] != null)) { a[name] = 1; }
    `);
  });

  it('handles member expression existence assignment with unsafe-to-repeat object', () => {
    check(`
      a()[b] ?= 1
    `, `
      var base;
      if (!((base = a())[b] != null)) { base[b] = 1; }
    `);
  });

  it('handles member expression existence assignment with unsafe-to-repeat key and object', () => {
    check(`
      a()[b()] ?= 1
    `, `
      var base;
      var name;
      if (!((base = a())[name = b()] != null)) { base[name] = 1; }
    `);
  });

  it('handles existence assignment used as an expression', () => {
    check(`
      a(b()[c()] ?= 1)
    `, `
      var base;
      var name;
      a(((base = b())[name = c()] != null) ? base[name] : base[name] = 1);
    `);
  });
});
