import check from './support/check';

describe('sequences', () => {
  it('become JavaScript sequence expressions', () => {
    check(`
      -> return (a; b)
    `, `
      () => (a, b);
    `);
  });

  it('that are nested become JavaScript sequence expressions', () => {
    check(`
      -> return (a; b; c)
    `, `
      () => (a, b, c);
    `);
  });
  
  it('handles newlines as separators', () => {
    check(`
      if a then (
        b
        c
      )
    `, `
      if (a) { 
        b;
        c
      ; }
    `);
  });

  it('handles mixed semicolon and newline-separated sequence expressions', () => {
    check(`
      a
      (
        b; c
        d
      )
    `, `
      a;
      
        b; c;
        d
      ;
    `);
  });

  it('handles a negated sequence operation', () => {
    check(`
      unless (a; b)
        c
    `, `
      if (!(a, b)) {
        c;
      }
    `);
  });
});
