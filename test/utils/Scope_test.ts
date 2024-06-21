import { ok, strictEqual } from 'assert';
import { parse, AssignOp, Identifier, Node } from 'decaffeinate-parser';
import Scope from '../../src/utils/Scope';

describe('scope', () => {
  const A = new Identifier(0, 0, 0, 1, 'x', 'x');
  const A2 = new Identifier(0, 0, 0, 1, 'y', 'y');
  const containerNode = new Identifier(0, 0, 0, 1, 'z', 'z');

  it('has no bindings by default', () => {
    const scope = new Scope(containerNode);
    strictEqual(scope.getBinding('a'), null);
  });

  it('allows declaring a binding by giving it a node', () => {
    const scope = new Scope(containerNode);
    scope.declares('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('can get bindings from a parent scope', () => {
    const parent = new Scope(containerNode);
    const scope = new Scope(containerNode, parent);

    parent.declares('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('accepts assignments for new bindings which become declarations', () => {
    const scope = new Scope(containerNode);
    scope.assigns('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('ignores assignments for existing bindings', () => {
    const scope = new Scope(containerNode);
    scope.assigns('a', A);
    scope.assigns('a', A2);
    strictEqual(scope.getBinding('a'), A);
  });

  it('processes assignments by binding all LHS identifiers', () => {
    const scope = new Scope(containerNode);

    scope.processNode(statement('a = 1'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope.inspect()}`);

    scope.processNode(statement('{b, c} = this'));
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope.inspect()}`);
    ok(scope.getBinding('c'), `\`c\` should be bound in: ${scope.inspect()}`);
  });

  it('processes functions by binding all its parameters', () => {
    const scope = new Scope(containerNode);
    scope.processNode(statement('(a, b) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope.inspect()}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope.inspect()}`);
  });

  it('processes bound functions by binding all its parameters', () => {
    const scope = new Scope(containerNode);
    scope.processNode(statement('(a, b) =>'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope.inspect()}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope.inspect()}`);
  });

  it('processes functions with default parameters', () => {
    const scope = new Scope(containerNode);
    scope.processNode(statement('(a=0) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope.inspect()}`);
  });

  it('processes functions with rest parameters', () => {
    const scope = new Scope(containerNode);
    scope.processNode(statement('(a...) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope.inspect()}`);
  });

  it('processes functions with destructured object parameters', () => {
    const scope = new Scope(containerNode);
    scope.processNode(statement('({a, b}) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope.inspect()}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope.inspect()}`);
  });

  it('processes functions with destructured array parameters', () => {
    const scope = new Scope(containerNode);
    scope.processNode(statement('([a, b]) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope.inspect()}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope.inspect()}`);
  });

  it('processes for-of loops by binding key and value assignees', () => {
    const scope = new Scope(containerNode);
    scope.processNode(statement('for key, {a, b, c: [d, e]} of object\n  key'));
    ['key', 'a', 'b', 'd', 'e'].forEach((name) =>
      ok(scope.getBinding(name), `\`${name}\` should be bound in: ${scope.inspect()}`),
    );
  });

  it('processes for-in loops by binding value assignees', () => {
    const scope = new Scope(containerNode);
    scope.processNode(statement('for [a, {b, c}, d] in array\n  a'));
    ['a', 'b', 'c', 'd'].forEach((name) =>
      ok(scope.getBinding(name), `\`${name}\` should be bound in: ${scope.inspect()}`),
    );
  });

  describe('claimFreeBinding', () => {
    it('returns "ref" if nothing is defined', () => {
      const scope = new Scope(containerNode);
      const node = statement('ref');
      strictEqual(scope.claimFreeBinding(node), 'ref');
    });

    it('adds a counter to the end of the binding if the binding is already taken', () => {
      const scope = new Scope(containerNode);
      const node = statement('ref = ref1 = 0') as AssignOp;
      scope.processNode(node);
      scope.processNode(node.expression);
      strictEqual(scope.claimFreeBinding(node), 'ref2');
    });

    it('allows a base other than the default to be given', () => {
      const scope = new Scope(containerNode);
      const node = statement('error = null');
      scope.processNode(node);
      strictEqual(scope.claimFreeBinding(node, 'error'), 'error1');
    });

    it('registers the claimed binding for subsequent calls', () => {
      const scope = new Scope(containerNode);
      const node = statement('0');
      scope.claimFreeBinding(node);
      scope.claimFreeBinding(node);
      strictEqual(scope.claimFreeBinding(node), 'ref2');
    });

    it('allows specifying multiple names to try', () => {
      const scope = new Scope(containerNode);
      const node = statement('i = 0');
      scope.processNode(node);
      strictEqual(scope.claimFreeBinding(node, ['i', 'j', 'k']), 'j');
    });
  });
});

function statement(code: string): Node {
  const body = parse(code).body;
  if (!body) {
    throw new Error('Expected non-null body.');
  }
  return body.statements[0];
}
