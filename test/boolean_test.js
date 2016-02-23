import check from './support/check';

describe('booleans', () => {
  it('converts `off` to `false`', () => {
    check(`off`, `false;`);
  });

  it('converts `on` to `true`', () => {
    check(`on`, `true;`);
  });

  it('leaves `false` as-is', () => {
    check(`false`, `false;`);
  });

  it('leaves `true` as-is', () => {
    check(`true`, `true;`);
  });

  it('renames `yes` to `true`', () => {
    check(`yes`, `true;`);
  });

  it('renames `no` to `false`', () => {
    check(`no`, `false;`);
  });
});
