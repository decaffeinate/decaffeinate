import check from './support/check.js';

describe('changing shorthand this to longhand this', function() {
  it('changes shorthand member expressions to longhand member expressions', () => {
    check(`a = @a`, `var a = this.a;`);
  });

  it('changes shorthand computed member expressions to longhand computed member expressions', () => {
    check(`a = @[a]`, `var a = this[a];`);
  });

  it('changes shorthand standalone this to longhand standalone this', () => {
    check(`bind(@)`, `bind(this);`);
  });

  it('does not change longhand this', () => {
    check(`this.a`, `this.a;`);
  });

  it('does not change "@" in strings', () => {
    check(`"@"`, `"@";`);
  });

  it('does not add a dot to the shorthand prototype operator', () => {
    check(`@::a`, `this.prototype.a;`);
  });

  it('does not double-expand nested member expressions', () => {
    check(`@a.b`, `this.a.b;`);
  });

  it('does not double-expand nested computed member expressions', () => {
    check(`@[a].b`, `this[a].b;`);
  });

  it('does not double-expand nested prototype access member expressions', () => {
    check(`@::a.b`, `this.prototype.a.b;`);
  });
});
