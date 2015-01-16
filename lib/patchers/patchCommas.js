const stripComments = require('../utils/stripComments').stripComments;

/**
 * Inserts missing commas in objects, arrays, and calls.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
function patchCommas(node, patcher) {
  switch (node.type) {
    case 'ObjectInitialiser':
    case 'ArrayInitialiser':
      patchCommasInList(node.members, patcher);
      break;

    case 'FunctionApplication':
      patchCommasInList(node.arguments, patcher);
      break;
  }
}
exports.patchCommas = patchCommas;

/**
 * Inserts missing commas between nodes in the given list.
 *
 * @param {Object[]} list
 * @param {MagicString} patcher
 */
function patchCommasInList(list, patcher) {
  for (var i = 1; i < list.length; i++) {
    var member = list[i - 1];
    var nextMember = list[i];
    var sourceBetween = stripComments(patcher.original.slice(member.range[1], nextMember.range[0]));
    if (sourceBetween.indexOf(',') < 0) {
      patcher.insert(member.range[1], ',');
    }
  }
}