const gobble = require('gobble');

module.exports = gobble('src').transform('6to5', { sourceMap: false });