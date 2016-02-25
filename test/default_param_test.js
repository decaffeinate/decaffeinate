import check from './support/check.js';

describe('default params', () => {
  it('ensures default value is left in place', () => {
    check(`(a=2) ->`, `(function(a=2) {});`);
  });

  it('ensures transforms happen on the default value', () => {
    check(`(a=b c) ->`, `(function(a=b(c)) {});`);
  });

  it('ensures @foo is transformed correctly', () => {
    check(`(a=@b) ->`, `(function(a=this.b) {});`);
  });
});
