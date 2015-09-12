import check from './support/check';

describe('instanceof', () => {
  it('passes through as-is', () => {
    check(`a instanceof b`, `a instanceof b;`);
  });

  it('allows transforming of its children', () => {
    check(`@a instanceof @b`, `this.a instanceof this.b;`);
  });

  it('works with negated `instanceof`', () => {
    check(`a not instanceof b`, `!(a instanceof b);`);
  });
});
