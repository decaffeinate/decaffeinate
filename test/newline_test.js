import check from './support/check';

describe('newlines', () => {
  it('handles code with Windows newlines', () => {
    check(
      '->\r\n  if a\r\n    b\r\n  return\r\n',
      '(function() {\r\n  if (a) {\r\n    b;\r\n  }\r\n});\r\n'
    );
  });

  it('handles code with mixed newlines, preferring UNIX when there is a tie', () => {
    check(
      '->\r\n  if a\n    b\n  return\r\n',
      '(function() {\n  if (a) {\n    b;\n  }\n});\n'
    );
  });

  it('handles code with UNIX newlines', () => {
    check(
      '->\n  if a\n    b\n  return\n',
      '(function() {\n  if (a) {\n    b;\n  }\n});\n'
    );
  });
});
