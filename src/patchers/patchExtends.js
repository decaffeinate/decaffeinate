/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchExtendsStart(node, patcher) {
  const { parentNode } = node;

  if (parentNode && parentNode.type === 'ExtendsOp') {
    if (node === parentNode.left) {
      patcher.insert(node.range[0], '((child, parent) => { for (var key in parent) { if ({}.hasOwnProperty.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; })(');
    }
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchExtendsEnd(node, patcher) {
  const { parentNode } = node;

  if (parentNode && parentNode.type === 'ExtendsOp') {
    const { left, right } = parentNode;
    if (node === left) {
      patcher.overwrite(left.range[1], right.range[0], ', ');
    } else if (node === right) {
      patcher.insert(right.range[1], ')');
    }
  }
}
