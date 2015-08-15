import check from './support/check';

describe('default params', () => {
  it('ensures transforms happen on the default value', () => {
    check(`(a=b.c?) ->`, `(function(a=(b.c != null)) {});`);
  });
});
