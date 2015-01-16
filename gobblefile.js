const gobble = require('gobble');

module.exports = gobble('lib').transform('6to5', { sourceMap: false });