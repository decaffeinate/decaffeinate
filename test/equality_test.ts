import check from './support/check';

describe('equality', () => {
  it('converts equality operator to triple-equal operator', () => {
    check(`a == b`, `a === b;`);
    check(`a is b`, `a === b;`);
  });

  it('converts negative equality operator to triple-not-equal operator', () => {
    check(`a != b`, `a !== b;`);
    check(`a isnt b`, `a !== b;`);
  });
});
