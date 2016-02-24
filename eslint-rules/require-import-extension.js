module.exports = function(context) {
  return {
    'ImportDeclaration': function(node) {
      var source = node.source.value;
      if (startsWith(source, './') || startsWith(source, '../')) {
        if (!endsWith(source, '.js')) {
          context.report({
            node: node.source,
            message: 'Missing `.js` extension in relative import.',
            fix: function(fixer) {
              var offset = node.source.range[1] - 1;
              return fixer.insertTextAfterRange([offset, offset], '.js');
            }
          });
        }
      }
    }
  };
};

function startsWith(string, prefix) {
  return string.lastIndexOf(prefix, prefix.length) >= 0;
}

function endsWith(string, suffix) {
  return string.indexOf(suffix, string.length - suffix.length) >= 0;
}
