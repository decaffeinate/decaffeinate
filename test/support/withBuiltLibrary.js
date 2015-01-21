const join = require('path').join;
var built;

module.exports = function withBuiltLibrary(path, callback) {
  if (!built) {
    built = require('../../gobblefile').build({
      dest: '.tmp', force: true
    }).catch(function(err) {
      console.error('Error building library:', err);
      throw err;
    });

    before(function() {
      return built;
    });
  }

  return built.then(function() {
    callback(require(join('../../.tmp', path)));
  });
};
