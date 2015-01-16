/**
 * Represents a CoffeeScript scope and its bindings.
 *
 * @param {?Scope} parent
 * @constructor
 */
function Scope(parent) {
  this.bindings = Object.create(parent ? parent.bindings : null);
}

/**
 * @param {string} name
 * @returns {?Object}
 */
Scope.prototype.getBinding = function(name) {
  return this.bindings[this.key(name)] || null;
};

/**
 * @param {string} name
 * @param {Object} node
 */
Scope.prototype.declares = function(name, node) {
  const key = this.key(name);
  this.bindings[key] = node;
};

/**
 * @param {string} name
 * @param {Object} node
 */
Scope.prototype.assigns = function(name, node) {
  if (!this.bindings[this.key(name)]) {
    // Not defined in this or any parent scope.
    this.declares(name, node);
  }
};

/**
 * @param {string} name
 * @returns {string}
 * @private
 */
Scope.prototype.key = function(name) {
  return '$' + name;
};

exports.Scope = Scope;
