var extname = require('path').extname;

module.exports = function(context) {
  return {
    'ImportDeclaration': function(node) {
      var source = node.source.value;
      if (startsWith(source, './') || startsWith(source, '../')) {
        var ext = extname(source);
        if (ext !== '.js' && ext !== '.json') {
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
