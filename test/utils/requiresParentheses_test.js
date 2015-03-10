import { strictEqual } from 'assert';
import parse from '../../src/utils/parse';
import requiresParentheses from '../../src/utils/requiresParentheses';

describe('requiresParentheses', function() {
  it('is false for identifiers', function() {
    const node = parse('a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is true for binary plus expressions', function() {
    const node = parse('a + b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary minus expressions', function() {
    const node = parse('a - b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for logical `and` expressions', function() {
    const node = parse('a && b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for logical `or` expressions', function() {
    const node = parse('a || b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary `and` expressions', function() {
    const node = parse('a & b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for binary `or` expressions', function() {
    const node = parse('a | b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for `xor` expressions', function() {
    const node = parse('a ^ b').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is false for logical not expressions', function() {
    const node = parse('!a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for unary plus expressions', function() {
    const node = parse('+a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for unary minus expressions', function() {
    const node = parse('-a').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is false for call expressions', function() {
    const node = parse('a()').body.statements[0];
    strictEqual(requiresParentheses(node), false);
  });

  it('is true for assignment expressions', function() {
    const node = parse('a = 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for equality expressions', function() {
    const node = parse('a == 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for non-equality expressions', function() {
    const node = parse('a != 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for less-than expressions', function() {
    const node = parse('a < 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for greater-than expressions', function() {
    const node = parse('a > 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for less-than-or-equal expressions', function() {
    const node = parse('a <= 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });

  it('is true for greater-than-or-equal expressions', function() {
    const node = parse('a >= 1').body.statements[0];
    strictEqual(requiresParentheses(node), true);
  });
});
