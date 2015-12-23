import isExpressionResultUsed from '../../src/utils/isExpressionResultUsed';
import parse from '../../src/utils/parse';
import { ok } from 'assert';

describe('isExpressionResultUsed', () => {
  it('is true for operands in a binary operator', () => {
    const ast = parse('a + b');
    ok(isExpressionResultUsed(ast.body.statements[0].left));
    ok(isExpressionResultUsed(ast.body.statements[0].right));
  });

  it('is true for operands in a unary operator', () => {
    const ast = parse('+b');
    ok(isExpressionResultUsed(ast.body.statements[0].expression));
  });

  it('is false for a top-level statement', () => {
    const ast = parse('a()');
    ok(!isExpressionResultUsed(ast.body.statements[0]));
  });

  it('is true for arguments to a function call', () => {
    const ast = parse('a(b)');
    ok(isExpressionResultUsed(ast.body.statements[0].arguments[0]));
  });

  it('is true for the right-hand side of an assignment', () => {
    const ast = parse('a = b = c');
    ok(isExpressionResultUsed(ast.body.statements[0].expression));
    ok(isExpressionResultUsed(ast.body.statements[0].expression.expression));
  });

  it('is false for conditional consequents', () => {
    const ast = parse('if a then b');
    ok(!isExpressionResultUsed(ast.body.statements[0].consequent));
  });

  it('is false for conditional alternates', () => {
    const ast = parse('if a then b else c');
    ok(!isExpressionResultUsed(ast.body.statements[0].alternate));
  });

  it('is true for implicitly-returned expressions', () => {
    const ast = parse('-> 1');
    ok(isExpressionResultUsed(ast.body.statements[0].body));
  });

  it('is false for function parameters', () => {
    const ast = parse('(a) ->');
    ok(!isExpressionResultUsed(ast.body.statements[0].parameters[0]));
  });

  it('is false for `for` assignees', () => {
    const ast = parse('a for a in b');
    ok(!isExpressionResultUsed(ast.body.statements[0].assignee));
  });

  it('is false for the LHS of an assignment', () => {
    const ast = parse('a = b');
    ok(!isExpressionResultUsed(ast.body.statements[0].assignee));
  });

  it('is true for the RHS of an assignment', () => {
    const ast = parse('a = b');
    ok(isExpressionResultUsed(ast.body.statements[0].expression));
  });
});
