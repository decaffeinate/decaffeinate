import check from './support/check';

describe('slice', () => {
  it('changes exclusive slices with any range values into a call to `.slice` directly', () => {
    check(`a[0...1]`, `a.slice(0, 1);`);
    check(`a[b...c]`, `a.slice(b, c);`);
  });

  it('changes slices with no end of range to a call to `.slice` with one argument', () => {
    check(`a[b..]`, `a.slice(b);`);
    check(`a[9...]`, `a.slice(9);`);
  });

  it('changes inclusive slices with a literal integer end of range to exclusive by incrementing the number', () => {
    check(`a[0..2]`, `a.slice(0, 3);`);
  });

  it('changes inclusive slices with a literal float end of range to exclusive by inserting `+ 1`', () => {
    check(`a[0..2.0]`, `a.slice(0, 2.0 + 1);`);
  });

  it('changes inclusive slices with a variable end of range to exclusive by inserting `+ 1`', () => {
    check(`a[0..b]`, `a.slice(0, b + 1);`);
  });
});
