import isExpressionResultUsed from '../../src/utils/isExpressionResultUsed.js';
import parse from '../../src/utils/parse.js';
import { ok } from 'assert';

describe('isExpressionResultUsed', () => {
  it('is true for operands in a binary operator', () => {
    let ast = parse('a + b');
    ok(isExpressionResultUsed(ast.body.statements[0].left));
    ok(isExpressionResultUsed(ast.body.statements[0].right));
  });

  it('is true for operands in a unary operator', () => {
    let ast = parse('+b');
    ok(isExpressionResultUsed(ast.body.statements[0].expression));
  });

  it('is false for a top-level statement', () => {
    let ast = parse('a()');
    ok(!isExpressionResultUsed(ast.body.statements[0]));
  });

  it('is true for arguments to a function call', () => {
    let ast = parse('a(b)');
    ok(isExpressionResultUsed(ast.body.statements[0].arguments[0]));
  });

  it('is true for the right-hand side of an assignment', () => {
    let ast = parse('a = b = c');
    ok(isExpressionResultUsed(ast.body.statements[0].expression));
    ok(isExpressionResultUsed(ast.body.statements[0].expression.expression));
  });

  it('is false for conditional consequents', () => {
    let ast = parse('if a then b');
    ok(!isExpressionResultUsed(ast.body.statements[0].consequent));
  });

  it('is false for conditional alternates', () => {
    let ast = parse('if a then b else c');
    ok(!isExpressionResultUsed(ast.body.statements[0].alternate));
  });

  it('is true for implicitly-returned expressions', () => {
    let ast = parse('-> 1');
    ok(isExpressionResultUsed(ast.body.statements[0].body));
  });

  it('is false for function parameters', () => {
    let ast = parse('(a) ->');
    ok(!isExpressionResultUsed(ast.body.statements[0].parameters[0]));
  });

  it('is false for `for` assignees', () => {
    let ast = parse('a for a in b');
    ok(!isExpressionResultUsed(ast.body.statements[0].assignee));
  });

  it('is false for the LHS of an assignment', () => {
    let ast = parse('a = b');
    ok(!isExpressionResultUsed(ast.body.statements[0].assignee));
  });

  it('is true for the RHS of an assignment', () => {
    let ast = parse('a = b');
    ok(isExpressionResultUsed(ast.body.statements[0].expression));
  });
});
