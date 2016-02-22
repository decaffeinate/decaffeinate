import check from './support/check';

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
      if (typeof a === 'undefined' || a === null) { a.b(); }
    `);
  });

  it('converts a complex soaked member access to a conditional with an assignment in the condition', () => {
    check(`
      a.b()?.c
    `, `
      var ref;
      if ((ref = a.b()) != null) { ref.c; }
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
    check(`
      if a?.b then c
    `, `
      if (typeof a !== 'undefined' && a !== null ? a.b : undefined) { c; }
    `);
  });

  it('handles nested soaked member access', () => {
    check(`
      a?.b?.c = 0;
    `, `
      if (typeof a !== 'undefined' && a !== null) { if (a.b != null) { a.b.c = 0; } }
    `);
  });
});
