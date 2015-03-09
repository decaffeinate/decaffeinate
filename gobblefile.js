const gobble = require('gobble');

module.exports = gobble('src').transform('babel', { sourceMap: false });