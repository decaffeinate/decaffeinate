import find from './array/find.js';
import flatMap from './flatMap.js';
import leftHandIdentifiers from './leftHandIdentifiers.js';

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
    let key = this.key(name);
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
   * @param {Object} node
   * @param {string|Array<string>=} name
   * @returns {string}
   */
  claimFreeBinding(node, name='ref') {
    let names = Array.isArray(name) ? name : [name];
    let binding = find(names, name => !this.getBinding(name));

    if (!binding) {
      let counter = 0;
      while (!binding) {
        counter += 1;
        binding = find(names, name => !this.getBinding(`${name}${counter}`));
      }
      binding = `${binding}${counter}`;
    }

    this.declares(binding, node);
    return binding;
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
        getBindingsForNode(node).forEach(identifier => this.declares(identifier.data, identifier));
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
    let parts = this.getOwnNames();
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

/**
 * Gets all the identifiers representing bindings in `node`.
 *
 * @param {Object} node
 * @returns {Object[]}
 */
function getBindingsForNode(node) {
  switch (node.type) {
    case 'Function':
    case 'BoundFunction':
      return flatMap(node.parameters, getBindingsForNode);

    case 'Identifier':
    case 'ArrayInitialiser':
    case 'ObjectInitialiser':
      return leftHandIdentifiers(node);

    case 'DefaultParam':
      return getBindingsForNode(node.param);

    case 'Rest':
      return getBindingsForNode(node.expression);

    case 'MemberAccessOp':
      return [];

    default:
      throw new Error(`unexpected parameter type: ${node.type}`);
  }
}
