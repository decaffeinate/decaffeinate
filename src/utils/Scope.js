import leftHandIdentifiers from './leftHandIdentifiers';

/**
 * Represents a CoffeeScript scope and its bindings.
 *
 * @param {?Scope} parent
 * @constructor
 */
export default class Scope {
  constructor(parent) {
    this.parent = parent;
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
   * @returns {string[]}
   */
  getOwnNames() {
    return Object.getOwnPropertyNames(this.bindings).map(key => this.unkey(key));
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
    return `$${name}`;
  }

  /**
   * @param {string} key
   * @returns {string}
   * @private
   */
  unkey(key) {
    return key.slice(1);
  }

  /**
   * Handles declarations or assigns for any bindings for a given node.
   *
   * @param {Object} node
   */
  processNode(node) {
    switch (node.type) {
      case 'AssignOp':
        leftHandIdentifiers(node.assignee).forEach(identifier =>
          this.assigns(identifier.data, identifier)
        );
        break;

      case 'Function':
      case 'BoundFunction':
        node.parameters.forEach(parameter => {
          if (parameter.type === 'DefaultParam') {
            this.declares(parameter.param.data, parameter.param);
          } else {
            this.declares(parameter.data, parameter)
          }
        });
        break;

      case 'ForIn':
      case 'ForOf':
        [node.keyAssignee, node.valAssignee].forEach(assignee => {
          if (assignee) {
            leftHandIdentifiers(assignee).forEach(identifier =>
              this.assigns(identifier.data, identifier)
            );
          }
        });
        break;
    }
  }

  /**
   * @returns {string}
   */
  toString() {
    const parts = this.getOwnNames();
    if (this.parent) {
      parts.push(`parent = ${this.parent}`);
    }
    return `${this.constructor.name} {${parts.length > 0 ? ` ${parts.join(', ')} ` : ''}}`;
  }

  /**
   * @returns {string}
   */
  inspect() {
    return this.toString();
  }
}
