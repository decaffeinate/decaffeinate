import {
  parse,
  AssignOp,
  DynamicMemberAccessOp,
  FunctionApplication,
  Identifier,
  MemberAccessOp,
  PostDecrementOp,
  PostIncrementOp,
  PreDecrementOp,
  PreIncrementOp,
  SoakedDynamicMemberAccessOp,
  SoakedMemberAccessOp,
  SoakedNewOp,
  CompoundAssignOp,
  SoakedFunctionApplication,
} from 'decaffeinate-parser';
import isInsideAssignee from '../../src/utils/isInsideAssignee';
import notNull from '../../src/utils/notNull';

describe('isInsideAssignee', () => {
  it('is true for a simple identifier LHS', () => {
    const ast = parse('a = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    expect(isInsideAssignee(assignment.assignee)).toBe(true);
  });

  it('is true for a compound assignment LHS', () => {
    const ast = parse('a += 1');
    const assignment = notNull(ast.body?.statements[0]) as CompoundAssignOp;
    expect(isInsideAssignee(assignment.assignee)).toBe(true);
  });

  it('is false for a simple identifier not in a LHS', () => {
    const ast = parse('a');
    const identifier = notNull(ast.body?.statements[0]) as Identifier;
    expect(isInsideAssignee(identifier)).toBe(false);
  });

  it('is false for the RHS of an assignment', () => {
    const ast = parse('a = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    expect(isInsideAssignee(assignment.expression)).toBe(false);
  });

  it('is true for the expression inside a member expression', () => {
    const ast = parse('a.b = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    expect(isInsideAssignee(assignee.expression)).toBe(true);
  });

  it('is false for the member inside a member expression', () => {
    const ast = parse('a.b = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    expect(isInsideAssignee(assignee.member)).toBe(false);
  });

  it('is true for the expression inside a dynamic member expression', () => {
    const ast = parse('a[b] = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    expect(isInsideAssignee(assignee.expression)).toBe(true);
  });

  it('is false for the indexing expression of a dynamic member expression', () => {
    const ast = parse('a[b] = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as DynamicMemberAccessOp;
    expect(isInsideAssignee(assignee.indexingExpr)).toBe(false);
  });

  it('is true for a function being called inside a member expression', () => {
    const ast = parse('a().b = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    const fnCall = assignee.expression as FunctionApplication;
    expect(isInsideAssignee(fnCall.function)).toBe(true);
  });

  it('is false for a function call argument inside a member expression', () => {
    const ast = parse('a(b).c = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    const fnCall = assignee.expression as FunctionApplication;
    const argument = fnCall.arguments[0] as Identifier;
    expect(isInsideAssignee(argument)).toBe(false);
  });

  it('is true for a soaked member expression', () => {
    const ast = parse('a?.b = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as SoakedMemberAccessOp;
    expect(isInsideAssignee(assignee)).toBe(true);
  });

  it('is true for the expression of a soaked member expression', () => {
    const ast = parse('a?.b = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as SoakedMemberAccessOp;
    expect(isInsideAssignee(assignee.expression)).toBe(true);
  });

  it('is false for the member of a soaked member expression', () => {
    const ast = parse('a?.b = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as SoakedMemberAccessOp;
    expect(isInsideAssignee(assignee.member)).toBe(false);
  });

  it('is true for a dynamic soaked member expression', () => {
    const ast = parse('a?[b] = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as SoakedDynamicMemberAccessOp;
    expect(isInsideAssignee(assignee)).toBe(true);
  });

  it('is true for the expression of a dynamic soaked member expression', () => {
    const ast = parse('a?[b] = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as SoakedDynamicMemberAccessOp;
    expect(isInsideAssignee(assignee.expression)).toBe(true);
  });

  it('is false for the indexing expression of a dynamic soaked member expression', () => {
    const ast = parse('a?[b] = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as SoakedDynamicMemberAccessOp;
    expect(isInsideAssignee(assignee.indexingExpr)).toBe(false);
  });

  it('is true for a soaked function application', () => {
    const ast = parse('a?(b).c = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    const soakedFnCall = assignee.expression as SoakedFunctionApplication;
    expect(isInsideAssignee(soakedFnCall)).toBe(true);
  });

  it('is true for the function of a soaked function application', () => {
    const ast = parse('a?(b).c = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    const soakedFnCall = assignee.expression as SoakedFunctionApplication;
    expect(isInsideAssignee(soakedFnCall.function)).toBe(true);
  });

  it('is false for the arguments of a soaked function application', () => {
    const ast = parse('a?(b).c = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    const soakedFnCall = assignee.expression as SoakedFunctionApplication;
    expect(isInsideAssignee(soakedFnCall.arguments[0])).toBe(false);
  });

  it('is true for a new soaked expression', () => {
    const ast = parse('(new A?(b)).b = 1');
    const assignment = notNull(ast.body?.statements[0]) as AssignOp;
    const assignee = assignment.assignee as MemberAccessOp;
    const newOp = assignee.expression as SoakedNewOp;
    expect(isInsideAssignee(newOp.ctor)).toBe(true);
  });

  it('is true for a post-incremented expression', () => {
    const ast = parse('a++');
    const assignment = notNull(ast.body?.statements[0]) as PostIncrementOp;
    expect(isInsideAssignee(assignment.expression)).toBe(true);
  });

  it('is true for a pre-incremented expression', () => {
    const ast = parse('++a');
    const assignment = notNull(ast.body?.statements[0]) as PreIncrementOp;
    expect(isInsideAssignee(assignment.expression)).toBe(true);
  });

  it('is true for a post-decremented expression', () => {
    const ast = parse('a--');
    const assignment = notNull(ast.body?.statements[0]) as PostDecrementOp;
    expect(isInsideAssignee(assignment.expression)).toBe(true);
  });

  it('is true for a pre-decremented expression', () => {
    const ast = parse('--a');
    const assignment = notNull(ast.body?.statements[0]) as PreDecrementOp;
    expect(isInsideAssignee(assignment.expression)).toBe(true);
  });
});
