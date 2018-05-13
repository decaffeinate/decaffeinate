import check from './support/check';

describe('arrays', () => {
  it('does not change empty arrays', () => {
    check(`[]`, `[];`);
  });

  it('does not change arrays with various values on one line', () => {
    check(`[  1,2,   3]`, `[  1,2,   3];`);
  });

  it('does not change multi-line arrays when there are all the commas between elements', () => {
    check(
      `
      [
        1,
        2
      ]
    `,
      `
      [
        1,
        2
      ];
    `
    );
  });

  it('does not change multi-line arrays when there are all the commas, even in weird places', () => {
    check(
      `
      [
        1
        ,
        2
        # hey
        ,
        3
      ]
    `,
      `
      [
        1
        ,
        2
        // hey
        ,
        3
      ];
    `
    );
  });

  it('adds missing commas between multi-line elements', () => {
    check(
      `
      [
        1
        2
        3
      ]
    `,
      `
      [
        1,
        2,
        3
      ];
    `
    );
  });

  it('adds missing commas even when there are commas in comments between elements', () => {
    check(
      `
      [
        1 #,
        2
      ]
    `,
      `
      [
        1, //,
        2
      ];
    `
    );
  });

  it('adds commas only at the end of the line', () => {
    check(
      `
      [
        1, 2
        3
        4
      ]
    `,
      `
      [
        1, 2,
        3,
        4
      ];
    `
    );
  });

  it('inserts commas in nested arrays', () => {
    check(
      `
      [
        [
          1
          2
        ]
        3
      ]
    `,
      `
      [
        [
          1,
          2
        ],
        3
      ];
    `
    );
  });

  it('handles arrays containing implicit function calls', () => {
    check(
      `
      [a(b, c {
      })]
    `,
      `
      [a(b, c({
      }))];
    `
    );
  });

  it('keeps array elements inserting within the array', () =>
    check(
      `
      [->
        a
        b]
    `,
      `
      [function() {
        a;
        return b;
      }];
    `
    ));

  it('allows semicolon delimiters between array values', () =>
    check(
      `
      [a, b; c, d;]
    `,
      `
      [a, b, c, d,];
    `
    ));

  it('allows a function call over an object followed by an object array element', () =>
    check(
      `
      [
        a {}
          b: {}
      ]
    `,
      `
      [
        a({}),
          {b: {}}
      ];
    `
    ));

  it('allows a block ending in an implicit call followed by an implicit object', () =>
    check(
      `
      [
        if a
          b c
         d: {}
      ]
    `,
      `
      [
        a ?
          b(c) : undefined,
         {d: {}}
      ];
    `
    ));
});
