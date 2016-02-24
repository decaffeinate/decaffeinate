import check from './support/check.js';

describe('default params', () => {
  it.skip('ensures transforms happen on the default value', () => {
    check(`(a=b.c?) ->`, `(function(a=(b.c != null)) {});`);
  });

  it.skip('ensures @foo is transformed correctly', () => {
    check(`(a=@b) ->`, `(function(a=this.b) {});`);
  });
});
