import check from './support/check';

describe('assignment', () => {
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
});
