import { ok, strictEqual } from 'assert';
import { parse } from 'decaffeinate-parser';
import { AssignOp, Identifier, Node } from 'decaffeinate-parser/dist/nodes';
import Scope from '../../src/utils/Scope';

describe('Scope', () => {
  let A = new Identifier(0, 0, 0, 1, 'x', 'x');
  let A2 = new Identifier(0, 0, 0, 1, 'y', 'y');
  let containerNode = new Identifier(0, 0, 0, 1, 'z', 'z');

  it('has no bindings by default', () => {
    let scope = new Scope(containerNode);
    strictEqual(scope.getBinding('a'), null);
  });

  it('allows declaring a binding by giving it a node', () => {
    let scope = new Scope(containerNode);
    scope.declares('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('can get bindings from a parent scope', () => {
    let parent = new Scope(containerNode);
    let scope = new Scope(containerNode, parent);

    parent.declares('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('accepts assignments for new bindings which become declarations', () => {
    let scope = new Scope(containerNode);
    scope.assigns('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('ignores assignments for existing bindings', () => {
    let scope = new Scope(containerNode);
    scope.assigns('a', A);
    scope.assigns('a', A2);
    strictEqual(scope.getBinding('a'), A);
  });

  it('processes assignments by binding all LHS identifiers', () => {
    let scope = new Scope(containerNode);

    scope.processNode(statement('a = 1'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);

    scope.processNode(statement('{b, c} = this'));
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
    ok(scope.getBinding('c'), `\`c\` should be bound in: ${scope}`);
  });

  it('processes functions by binding all its parameters', () => {
    let scope = new Scope(containerNode);
    scope.processNode(statement('(a, b) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
  });

  it('processes bound functions by binding all its parameters', () => {
    let scope = new Scope(containerNode);
    scope.processNode(statement('(a, b) =>'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
  });

  it('processes functions with default parameters', () => {
    let scope = new Scope(containerNode);
    scope.processNode(statement('(a=0) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
  });

  it('processes functions with rest parameters', () => {
    let scope = new Scope(containerNode);
    scope.processNode(statement('(a...) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
  });

  it('processes functions with destructured object parameters', () => {
    let scope = new Scope(containerNode);
    scope.processNode(statement('({a, b}) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
  });

  it('processes functions with destructured array parameters', () => {
    let scope = new Scope(containerNode);
    scope.processNode(statement('([a, b]) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
  });

  it('processes for-of loops by binding key and value assignees', () => {
    let scope = new Scope(containerNode);
    scope.processNode(statement('for key, {a, b, c: [d, e]} of object\n  key'));
    ['key', 'a', 'b', 'd', 'e'].forEach(name => ok(scope.getBinding(name), `\`${name}\` should be bound in: ${scope}`));
  });

  it('processes for-in loops by binding value assignees', () => {
    let scope = new Scope(containerNode);
    scope.processNode(statement('for [a, {b, c}, d] in array\n  a'));
    ['a', 'b', 'c', 'd'].forEach(name => ok(scope.getBinding(name), `\`${name}\` should be bound in: ${scope}`));
  });

  describe('claimFreeBinding', () => {
    it('returns "ref" if nothing is defined', () => {
      let scope = new Scope(containerNode);
      let node = statement('ref');
      strictEqual(scope.claimFreeBinding(node), 'ref');
    });

    it('adds a counter to the end of the binding if the binding is already taken', () => {
      let scope = new Scope(containerNode);
      let node = statement('ref = ref1 = 0') as AssignOp;
      scope.processNode(node);
      scope.processNode(node.expression);
      strictEqual(scope.claimFreeBinding(node), 'ref2');
    });

    it('allows a base other than the default to be given', () => {
      let scope = new Scope(containerNode);
      let node = statement('error = null');
      scope.processNode(node);
      strictEqual(scope.claimFreeBinding(node, 'error'), 'error1');
    });

    it('registers the claimed binding for subsequent calls', () => {
      let scope = new Scope(containerNode);
      let node = statement('0');
      scope.claimFreeBinding(node);
      scope.claimFreeBinding(node);
      strictEqual(scope.claimFreeBinding(node), 'ref2');
    });

    it('allows specifying multiple names to try', () => {
      let scope = new Scope(containerNode);
      let node = statement('i = 0');
      scope.processNode(node);
      strictEqual(scope.claimFreeBinding(node, ['i', 'j', 'k']), 'j');
    });
  });
});

function statement(code: string): Node {
  let body = parse(code).body;
  if (!body) {
    throw new Error('Expected non-null body.');
  }
  return body.statements[0];
}
