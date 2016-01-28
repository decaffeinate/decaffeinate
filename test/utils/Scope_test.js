import { ok, strictEqual } from 'assert';
import { parse } from 'coffee-script-redux';
import Scope from '../../src/utils/Scope';

describe('Scope', function() {
  const A = {};
  const A2 = {};

  it('has no bindings by default', function() {
    const scope = new Scope();
    strictEqual(scope.getBinding('a'), null);
  });

  it('allows declaring a binding by giving it a node', function() {
    const scope = new Scope();
    scope.declares('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('can get bindings from a parent scope', function() {
    const parent = new Scope();
    const scope = new Scope(parent);

    parent.declares('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('accepts assignments for new bindings which become declarations', function() {
    const scope = new Scope();
    scope.assigns('a', A);
    strictEqual(scope.getBinding('a'), A);
  });

  it('ignores assignments for existing bindings', function() {
    const scope = new Scope();
    scope.assigns('a', A);
    scope.assigns('a', A2);
    strictEqual(scope.getBinding('a'), A);
  });

  it('processes assignments by binding all LHS identifiers', function() {
    const scope = new Scope();

    scope.processNode(statement('a = 1'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);

    scope.processNode(statement('{b, c} = this'));
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
    ok(scope.getBinding('c'), `\`c\` should be bound in: ${scope}`);
  });

  it('processes functions by binding all its parameters', function() {
    const scope = new Scope();
    scope.processNode(statement('(a, b) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
  });

  it('processes bound functions by binding all its parameters', function() {
    const scope = new Scope();
    scope.processNode(statement('(a, b) =>'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
  });

  it('processes functions with default parameters', function() {
    const scope = new Scope();
    scope.processNode(statement('(a=0) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
  });

  it('processes functions with rest parameters', function() {
    const scope = new Scope();
    scope.processNode(statement('(a...) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
  });

  it('processes functions with destructured object parameters', function() {
    const scope = new Scope();
    scope.processNode(statement('({a, b}) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
  });

  it('processes functions with destructured array parameters', function() {
    const scope = new Scope();
    scope.processNode(statement('([a, b]) ->'));
    ok(scope.getBinding('a'), `\`a\` should be bound in: ${scope}`);
    ok(scope.getBinding('b'), `\`b\` should be bound in: ${scope}`);
  });

  it('processes for-of loops by binding key and value assignees', function() {
    const scope = new Scope();
    scope.processNode(statement('for key, {a, b, c: [d, e]} of object\n  key'));
    ['key', 'a', 'b', 'd', 'e'].forEach(name =>
        ok(scope.getBinding(name), `\`${name}\` should be bound in: ${scope}`)
    );
  });

  it('processes for-in loops by binding value assignees', function() {
    const scope = new Scope();
    scope.processNode(statement('for [a, {b, c}, d] in array\n  a'));
    ['a', 'b', 'c', 'd'].forEach(name =>
        ok(scope.getBinding(name), `\`${name}\` should be bound in: ${scope}`)
    );
  });
});

function statement(code) {
  return parse(code).toBasicObject().body.statements[0];
}
