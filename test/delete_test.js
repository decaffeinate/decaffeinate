import check from './support/check';

describe('delete', () => {
  it('is passed through as-is', () => {
    check(`delete a.b`, `delete a.b;`);
  });

  it('processes its expression', () => {
    check(`delete a["#{0}"]`, 'delete a[`${0}`];');
  });
});
