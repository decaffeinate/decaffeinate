/**
 * Represents a CoffeeScript scope and its bindings.
 *
 * @param {?Scope} parent
 * @constructor
 */
export default class Scope {
  constructor(parent) {
    this.bindings = Object.create(parent ? parent.bindings : null);
  }

  /**
   * @param {string} name
   * @returns {?Object}
   */
  getBinding(name) {
    return this.bindings[this.key(name)] || null;
  }

  /**
   * @param {string} name
   * @param {Object} node
   */
  declares(name, node) {
    const key = this.key(name);
    this.bindings[key] = node;
  }

  /**
   * @param {string} name
   * @param {Object} node
   */
  assigns(name, node) {
    if (!this.bindings[this.key(name)]) {
      // Not defined in this or any parent scope.
      this.declares(name, node);
    }
  }

  /**
   * @param {string} name
   * @returns {string}
   * @private
   */
  key(name) {
    return '$' + name;
  }
}
