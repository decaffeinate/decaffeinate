import check from './support/check';

describe('division', () => {
  it('is passed through', () => {
    check(`
      a / b
    `, `
      a / b;
    `);
  });

  it('transforms left and right', () => {
    check(`
      (a ? b) / (c ? d)
    `, `
      ((typeof a !== "undefined" && a !== null) ? a : b) / ((typeof c !== "undefined" && c !== null) ? c : d);
    `);
  });
});
