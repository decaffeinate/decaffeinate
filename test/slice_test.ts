import check from './support/check';
import validate from './support/validate';

describe('slice', () => {
  it('changes exclusive slices with any range values into a call to `.slice` directly', () => {
    check(`a[0...1]`, `a.slice(0, 1);`);
    check(`a[b...c]`, `a.slice(b, c);`);
  });

  it('changes slices with no end of range to a call to `.slice` with one argument', () => {
    check(`a[b..]`, `a.slice(b);`);
    check(`a[9...]`, `a.slice(9);`);
  });

  it('changes slices with no start of range to a call to `.slice` starting at 0', () => {
    check(`a[...2]`, `a.slice(0, 2);`);
  });

  it('changes inclusive slices with a literal integer end of range to exclusive by incrementing the number', () => {
    check(`a[0..2]`, `a.slice(0, 3);`);
  });

  it('changes inclusive slices ending in -1 to not specify a second argument', () => {
    check(`a[0..-1]`, `a.slice(0);`);
  });

  it('changes inclusive slices with a literal float end of range to exclusive by inserting `+ 1`', () => {
    check(`a[0..2.0]`, `a.slice(0, +2.0 + 1 || undefined);`);
  });

  it('changes inclusive slices with a variable end of range to exclusive by inserting `+ 1`', () => {
    check(`a[0..b]`, `a.slice(0, +b + 1 || undefined);`);
  });

  it('changes slices with no begin or end of the range to a bare call to `.slice`', () => {
    check(`a[..]`, `a.slice();`);
    check(`a[...]`, `a.slice();`);
  });

  it('patches the left and right', () => {
    check(`a[(b c)...(d e)]`, `a.slice((b(c)), (d(e)));`);
  });

  it('patches the expression', () => {
    check(`@a[b...c]`, `this.a.slice(b, c);`);
  });

  it('treats the left side as an expression', () => {
    check(
      `
      a = (b for c in d when e)[...2]
    `,
      `
      const a = (Array.from(d).filter((c) => e).map((c) => b)).slice(0, 2);
    `,
    );
  });

  it('properly handles string bounds in an inclusive range', () => {
    validate(
      `
      a = [1, 2, 3, 4, 5]
      start = '1'
      end = '3'
      setResult(a[start..end])
    `,
      [2, 3, 4],
    );
  });

  it('does not generate a preincrement operator when adding `+` to an inclusive end', () => {
    check(
      `
      a[start..+end]
    `,
      `
      a.slice(start, + +end + 1 || undefined);
    `,
    );
  });

  it('handles an exclusive splice with both bounds specified', () => {
    check(
      `
      a[b...c] = d
    `,
      `
      a.splice(b, c - b, ...[].concat(d));
    `,
    );
  });

  it('handles an inclusive splice with both bounds specified', () => {
    check(
      `
      a[b..c] = d
    `,
      `
      a.splice(b, c - b + 1, ...[].concat(d));
    `,
    );
  });

  it('handles an exclusive splice with the first bound specified', () => {
    check(
      `
      a[b...] = c
    `,
      `
      a.splice(b, 9e9, ...[].concat(c));
    `,
    );
  });

  it('handles an inclusive splice with the first bound specified', () => {
    check(
      `
      a[b..] = c
    `,
      `
      a.splice(b, 9e9, ...[].concat(c));
    `,
    );
  });

  it('handles an exclusive splice with the last bound specified', () => {
    check(
      `
      a[...b] = c
    `,
      `
      a.splice(0, b, ...[].concat(c));
    `,
    );
  });

  it('handles an inclusive splice with the last bound specified', () => {
    check(
      `
      a[..b] = c
    `,
      `
      a.splice(0, b + 1, ...[].concat(c));
    `,
    );
  });

  it('handles an exclusive splice over an unbounded range', () => {
    check(
      `
      a[...] = b
    `,
      `
      a.splice(0, 9e9, ...[].concat(b));
    `,
    );
  });

  it('handles an inclusive splice over an unbounded range', () => {
    check(
      `
      a[..] = b
    `,
      `
      a.splice(0, 9e9, ...[].concat(b));
    `,
    );
  });

  it('does not extract the RHS if it is not necessary', () => {
    check(
      `
      a[b..c] = d()
    `,
      `
      a.splice(b, c - b + 1, ...[].concat(d()));
    `,
    );
  });

  it('extracts the array into a variable if necessary', () => {
    check(
      `
      =>
        return a[b...c] = d()
    `,
      `
      () => {
        let ref;
        return ref = d(), a.splice(b, c - b, ...[].concat(ref)), ref;
      };
    `,
    );
  });

  it('allows overwriting with an array', () => {
    validate(
      `
      arr = ['a', 'b', 'c', 'd']
      arr[1...3] = ['Hello', 'World']
      setResult(arr)
    `,
      ['a', 'Hello', 'World', 'd'],
    );
  });

  it('allows overwriting with an individual element', () => {
    validate(
      `
      arr = ['a', 'b', 'c', 'd']
      arr[1...3] = 'Hello';
      setResult(arr)
    `,
      ['a', 'Hello', 'd'],
    );
  });

  it('respects precedence on slice ranges', () => {
    check(
      `
      a[b..c or d]
    `,
      `
      a.slice(b, +(c || d) + 1 || undefined);
    `,
    );
  });

  it('respects precedence on splice ranges', () => {
    check(
      `
      a[b..c or d] = e
    `,
      `
      a.splice(b, (c || d) - b + 1, ...[].concat(e));
    `,
    );
  });

  it('behaves properly when there is a logical operator in a slice range', () => {
    validate(
      `
      a = [1..4]
      setResult(a[..2 or 3])
    `,
      [1, 2, 3],
    );
  });
});
