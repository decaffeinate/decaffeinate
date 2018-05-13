import check from './support/check';

describe('range', () => {
  it('converts short literal array ranges to literal arrays', () => {
    check(
      `
      [0..20]
    `,
      `
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    `
    );

    check(
      `
      [2..0]
    `,
      `
      [2, 1, 0];
    `
    );
  });

  it('converts short literal non-inclusive ranges to literal arrays', () => {
    check(
      `
      [0...20]
    `,
      `
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    `
    );

    check(
      `
      [2...0]
    `,
      `
      [2, 1];
    `
    );
  });

  it('converts long literal array ranges to IIFEs for building at runtime', () => {
    check(
      `
      [0..100]
    `,
      `
      __range__(0, 100, true);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );

    check(
      `
      [100..0]
    `,
      `
      __range__(100, 0, true);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );
  });

  it('converts long literal non-inclusive array ranges to IIFEs for building at runtime', () => {
    check(
      `
      [0...100]
    `,
      `
      __range__(0, 100, false);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );

    check(
      `
      [100...0]
    `,
      `
      __range__(100, 0, false);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );
  });

  it('converts variable ranges to IIFEs for building at runtime', () => {
    check(
      `
      [a..b]
    `,
      `
      __range__(a, b, true);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );
  });

  it('converts non-inclusive variable ranges to IIFEs for building at runtime', () => {
    check(
      `
      [a...b]
    `,
      `
      __range__(a, b, false);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );
  });

  it('converts variable ranges with side-effects into IIFEs for building at runtime', () => {
    check(
      `
      [a()..b]
    `,
      `
      __range__(a(), b, true);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );

    check(
      `
      [a..b()]
    `,
      `
      __range__(a, b(), true);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );

    check(
      `
      [a()..b()]
    `,
      `
      __range__(a(), b(), true);
      function __range__(left, right, inclusive) {
        let range = [];
        let ascending = left < right;
        let end = !inclusive ? right : ascending ? right + 1 : right - 1;
        for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
          range.push(i);
        }
        return range;
      }
    `
    );
  });
});
