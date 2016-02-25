module.exports = function(context) {
  return {
    'VariableDeclaration': function(node) {
      if (node.kind === 'const') {
        var parent = node.parent;
        if (parent.type !== 'Program') {
          context.report({
            message: '`const` declarations are only allowed at the top of the program',
            node: node,
            fix: function(fixer) {
              var start = node.range[0];
              return fixer.replaceTextRange(
                [start, start + 'const'.length],
                'let'
              );
            }
          });
        } else {
          for (var i = 0; i < node.declarations.length; i++) {
            var id = node.declarations[i].id;
            if (!id) {
              context.report({
                message: '`const` declaration has non-identifier name',
                node: node.declarations[i]
              });
            } else if (id.name.toUpperCase() !== id.name) {
              context.report({
                message: '`const` declarations must be ALL_CAPS',
                node: node.declarations[i]
              });
            }
          }
        }
      }
    }
  };
};
