import check from './support/check';

describe('regular expressions', () => {
  it('handles back-to-back escapes correctly', () => {
    check(`/\\/\\//`, `/\\/\\//;`);
  });
});
