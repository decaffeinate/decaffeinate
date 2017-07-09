import check from './support/check';

describe('increment', () => {
  it('supports simple post-increment', () => {
    check(`a++`, `a++;`);
    check(`a--`, `a--;`);
  });

  it('supports simple pre-increment', () => {
    check(`++a`, `++a;`);
    check(`--a`, `--a;`);
  });

  it('supports complex post-increment', () => {
    check(`(a++).b++`, `(a++).b++;`);
    check(`(a--).b--`, `(a--).b--;`);
  });

  it('supports complex pre-increment', () => {
    check(`++(++a).b`, `++(++a).b;`);
    check(`--(--a).b`, `--(--a).b;`);
  });
});
