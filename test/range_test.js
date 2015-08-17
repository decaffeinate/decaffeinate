import check from './support/check';

describe('range', () => {
  it('converts short literal array ranges to literal arrays', () => {
    check(`
      [0..20]
    `, `
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    `);

    check(`
      [2..0]
    `, `
      [2, 1, 0];
    `);
  });

  it('converts short literal non-inclusive ranges to literal arrays', () => {
    check(`
      [0...20]
    `, `
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
    `);

    check(`
      [2...0]
    `, `
      [2, 1];
    `);
  });

  it('converts long literal array ranges to IIFEs for building at runtime', () => {
    check(`
      [0..100]
    `, `
      ((function() {
        var result = [];
        var i = 0;
        while (i <= 100) {
          result.push(i++);
        }
        return result;
      })());
    `);

    check(`
      [100..0]
    `, `
      ((function() {
        var result = [];
        var i = 100;
        while (i >= 0) {
          result.push(i--);
        }
        return result;
      })());
    `);
  });

  it('converts long literal non-inclusive array ranges to IIFEs for building at runtime', () => {
    check(`
      [0...100]
    `, `
      ((function() {
        var result = [];
        var i = 0;
        while (i < 100) {
          result.push(i++);
        }
        return result;
      })());
    `);

    check(`
      [100...0]
    `, `
      ((function() {
        var result = [];
        var i = 100;
        while (i > 0) {
          result.push(i--);
        }
        return result;
      })());
    `);
  });

  it('converts variable ranges to IIFEs for building at runtime', () => {
    check(`
      [a..b]
    `, `
      ((function() {
        var result = [];
        var i = a;
        if (a <= b) {
          while (i <= b) {
            result.push(i++);
          }
        } else {
          while (i >= b) {
            result.push(i--);
          }
        }
        return result;
      })());
    `);
  });

  it('converts non-inclusive variable ranges to IIFEs for building at runtime', () => {
    check(`
      [a...b]
    `, `
      ((function() {
        var result = [];
        var i = a;
        if (a <= b) {
          while (i < b) {
            result.push(i++);
          }
        } else {
          while (i > b) {
            result.push(i--);
          }
        }
        return result;
      })());
    `);
  });

  it('converts variable ranges with side-effects into IIFEs for building at runtime', () => {
    check(`
      [a()..b]
    `, `
      ((function() {
        var result = [];
        var start = a();
        var i = start;
        if (start <= b) {
          while (i <= b) {
            result.push(i++);
          }
        } else {
          while (i >= b) {
            result.push(i--);
          }
        }
        return result;
      })());
    `);

    check(`
      [a..b()]
    `, `
      ((function() {
        var result = [];
        var end = b();
        var i = a;
        if (a <= end) {
          while (i <= end) {
            result.push(i++);
          }
        } else {
          while (i >= end) {
            result.push(i--);
          }
        }
        return result;
      })());
    `);

    check(`
      [a()..b()]
    `, `
      ((function() {
        var result = [];
        var start = a();
        var end = b();
        var i = start;
        if (start <= end) {
          while (i <= end) {
            result.push(i++);
          }
        } else {
          while (i >= end) {
            result.push(i--);
          }
        }
        return result;
      })());
    `);
  });

  it('avoids clobbering variables in scope', () => {
    check(`
      i = 0
      result = 1
      [0..100]
    `, `
      var i = 0;
      var result = 1;
      ((function() {
        var result1 = [];
        var i1 = 0;
        while (i1 <= 100) {
          result1.push(i1++);
        }
        return result1;
      })());
    `);

    check(`
      result = {}
      i = 0
      start = -> 1
      end = -> 2
      [start()..end(result)]
    `, `
      var result = {};
      var i = 0;
      var start = function() { return 1; };
      var end = function() { return 2; };
      ((function() {
        var result1 = [];
        var start1 = start();
        var end1 = end(result);
        var i1 = start1;
        if (start1 <= end1) {
          while (i1 <= end1) {
            result1.push(i1++);
          }
        } else {
          while (i1 >= end1) {
            result1.push(i1--);
          }
        }
        return result1;
      })());
    `);
  });
});
