import check from './support/check';

test('does not wrap in an IIFE by default', () => {
  check(`a = 1`, `const a = 1;`);
});

test('wraps in an IIFE if requested', () => {
  check(`a = 1`, `(function() {\nconst a = 1;\n}).call(this);`, { options: { bare: false } });
});

test('cannot be used with useJSModules', () => {
  expect(() => check(`a = 1`, `const a = 1;`, { options: { useJSModules: true, bare: false } })).toThrow(
    /useJSModules requires bare output/,
  );
});
