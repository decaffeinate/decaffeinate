import check from './support/check';
import validate from './support/validate';

describe('spread', () => {
  it('handles simple function calls', () => {
    check(`
      a(b...)
    `, `
      a(...Array.from(b || []));
    `);
  });

  it('handles advanced function calls', () => {
    check(`
      a(1, 2, makeArray(arguments...)...)
    `, `
      a(1, 2, ...Array.from(makeArray(...arguments)));
    `);
  });

  it('has the correct runtime behavior when spreading null in a function call', () => {
    validate(`
      f = -> arguments.length
      setResult(f(null...))
    `, 0);
  });

  it('has the correct runtime behavior when spreading a fake array in a function call', () => {
    validate(`
      f = -> arguments.length
      obj = {length: 2, 0: 'a', 1: 'b'}
      setResult(f(1, 2, obj...))
    `, 4);
  });

  it('handles simple array literals', () => {
    check(`
      [b...]
    `, `
      [...Array.from(b)];
    `);
  });

  it('handles advanced array literals', () => {
    check(`
      [1, 2, makeArray(arguments...)...]
    `, `
      [1, 2, ...Array.from(makeArray(...arguments))];
    `);
  });

  it('has the correct runtime behavior when spreading a fake array in an array literal', () => {
    validate(`
      obj = {length: 2, 0: 'a', 1: 'b'}
      setResult([1, 2, obj...])
    `, [1, 2, 'a', 'b']);
  });
});
