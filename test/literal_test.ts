import check from './support/check';

describe('literals', () => {
  it('leaves `undefined` as-is', () => {
    check(`undefined`, `undefined;`);
  });

  it('leaves `null` as-is', () => {
    check(`null`, `null;`);
  });

  it('leaves floats as-is', () => {
    check(`1.0`, `1.0;`);
  });
});
