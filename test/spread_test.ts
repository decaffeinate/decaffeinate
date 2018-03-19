import {checkCS1, checkCS2} from './support/check';
import validate, {validateCS1} from './support/validate';

describe('spread', () => {
  it('handles simple function calls', () => {
    checkCS1(`
      a(b...)
    `, `
      a(...Array.from(b || []));
    `);
  });

  it('handles simple function calls in CS2', () => {
    checkCS2(`
      a(b...)
    `, `
      a(...b);
    `);
  });

  it('handles advanced function calls', () => {
    checkCS1(`
      a(1, 2, makeArray(arguments...)...)
    `, `
      a(1, 2, ...Array.from(makeArray(...arguments)));
    `);
  });

  it('handles advanced function calls in CS2', () => {
    checkCS2(`
      a(1, 2, makeArray(arguments...)...)
    `, `
      a(1, 2, ...makeArray(...arguments));
    `);
  });

  it('has the correct runtime behavior when spreading null in a function call', () => {
    validate(`
      f = -> arguments.length
      try
        # Works in CS1
        setResult(f(null...))
      catch
        setResult('Fails in CS2')
    `, {cs1: 0, cs2: 'Fails in CS2'});
  });

  it('has the correct runtime behavior when spreading a fake array in a function call', () => {
    // Ignore CS2 checking since Babel handles this case wrong and doesn't crash.
    validateCS1(`
      f = -> arguments.length
      obj = {length: 2, 0: 'a', 1: 'b'}
      setResult(f(1, 2, obj...))
    `, 4);
  });

  it('handles simple array literals', () => {
    checkCS1(`
      [b...]
    `, `
      [...Array.from(b)];
    `);
  });

  it('handles simple array literals in CS2', () => {
    checkCS2(`
      [b...]
    `, `
      [...b];
    `);
  });

  it('handles advanced array literals', () => {
    checkCS1(`
      [1, 2, makeArray(arguments...)...]
    `, `
      [1, 2, ...Array.from(makeArray(...arguments))];
    `);
  });

  it('handles advanced array literals in CS2', () => {
    checkCS2(`
      [1, 2, makeArray(arguments...)...]
    `, `
      [1, 2, ...makeArray(...arguments)];
    `);
  });

  it('has the correct runtime behavior when spreading a fake array in an array literal', () => {
    // Ignore CS2 checking since Babel handles this case wrong and doesn't crash.
    validateCS1(`
      obj = {length: 2, 0: 'a', 1: 'b'}
      setResult([1, 2, obj...])
    `, [1, 2, 'a', 'b']);
  });

  it('handles array spread with the operator on the LHS', () => {
    checkCS2(`
      a = [...b, c]
    `, `
      const a = [...b, c];
    `);
  });
});
