const Scope = require('../../.tmp/utils/Scope');
const assert = require('assert');
const parse = require('coffee-script-redux').parse;

describe('Scope', function() {
  const A = {};
  const A2 = {};

  it('has no bindings by default', function() {
    const scope = new Scope();
    assert.strictEqual(scope.getBinding('a'), null);
  });

  it('allows declaring a binding by giving it a node', function() {
    const scope = new Scope();
    scope.declares('a', A);
    assert.strictEqual(scope.getBinding('a'), A);
  });

  it('can get bindings from a parent scope', function() {
    const parent = new Scope();
    const scope = new Scope(parent);

    parent.declares('a', A);
    assert.strictEqual(scope.getBinding('a'), A);
  });

  it('accepts assignments for new bindings which become declarations', function() {
    const scope = new Scope();
    scope.assigns('a', A);
    assert.strictEqual(scope.getBinding('a'), A);
  });

  it('ignores assignments for existing bindings', function() {
    const scope = new Scope();
    scope.assigns('a', A);
    scope.assigns('a', A2);
    assert.strictEqual(scope.getBinding('a'), A);
  });

  describe('#processNode', function() {
    it('processes assignments by binding all LHS identifiers', function() {
      const scope = new Scope();

      scope.processNode(parse('a = 1').toBasicObject().body.statements[0]);
      assert.ok(scope.getBinding('a'), '`a` should be bound in: ' + scope);

      scope.processNode(parse('{b, c} = this').toBasicObject().body.statements[0]);
      assert.ok(scope.getBinding('b'), '`b` should be bound in: ' + scope);
      assert.ok(scope.getBinding('c'), '`c` should be bound in: ' + scope);
    });

    it('processes functions by binding all its parameters', function() {
      const scope = new Scope();

      scope.processNode(parse('(a, b) ->').toBasicObject().body.statements[0]);
      assert.ok(scope.getBinding('a'), '`a` should be bound in: ' + scope);
      assert.ok(scope.getBinding('b'), '`b` should be bound in: ' + scope);
    });
  });
});
