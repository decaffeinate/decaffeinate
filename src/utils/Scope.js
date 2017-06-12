/* @flow */

import find from './array/find';
import flatMap from './flatMap';
import isReservedWord from './isReservedWord';
import leftHandIdentifiers from './leftHandIdentifiers';
import type { Node } from '../patchers/types';

type Bindings = { [key: string]: Node };

/**
 * Represents a CoffeeScript scope and its bindings.
 */
export default class Scope {
  parent: ?Scope;
  bindings: Bindings;
  innerClosureAssignments: { [key: string]: boolean };
  containerNode: Node;

  constructor(containerNode: Node, parent: ?Scope=null) {
    this.parent = parent;
    this.bindings = Object.create(parent ? parent.bindings : {});
    this.innerClosureAssignments = {};
    this.containerNode = containerNode;
  }

  getBinding(name: string): ?Node {
    return this.bindings[this.key(name)] || null;
  }

  isBindingAvailable(name: string): boolean {
    return !this.getBinding(name) && !isReservedWord(name);
  }

  hasBinding(name: string): boolean {
    return this.getBinding(name) !== null;
  }

  hasInnerClosureAssignment(name: string): boolean {
    return this.innerClosureAssignments[this.key(name)] || false;
  }

  getOwnNames(): Array<string> {
    return Object.getOwnPropertyNames(this.bindings).map(key => this.unkey(key));
  }

  hasOwnBinding(name: string): boolean {
    return this.bindings.hasOwnProperty(this.key(name));
  }

  declares(name: string, node: Node) {
    let key = this.key(name);
    this.bindings[key] = node;
  }

  assigns(name: string, node: Node) {
    if (!this.bindings[this.key(name)]) {
      // Not defined in this or any parent scope.
      this.declares(name, node);
    } else if (!this.hasOwnBinding(name)) {
      let parent = this.parent;
      while (parent) {
        if (parent.hasOwnBinding(name)) {
          parent.innerClosureAssignments[this.key(name)] = true;
          break;
        }
        parent = parent.parent;
      }
    }
  }

  claimFreeBinding(node: Node, name: ?(string | Array<string>)=null): string {
    if (!name) { name = 'ref'; }
    let names = Array.isArray(name) ? name : [name];
    let binding = find(names, name => this.isBindingAvailable(name));

    if (!binding) {
      let counter = 0;
      while (!binding) {
        if (counter > 1000) {
          throw new Error(`Unable to find free binding for names ${names.toString()}`);
        }
        counter += 1;
        binding = find(names, name => this.isBindingAvailable(`${name}${counter}`));
      }
      binding = `${binding}${counter}`;
    }

    this.declares(binding, node);
    return binding;
  }

  /**
   * @private
   */
  key(name: string): string {
    return `$${name}`;
  }

  /**
   * @private
   */
  unkey(key: string): string {
    return key.slice(1);
  }

  /**
   * Handles declarations or assigns for any bindings for a given node.
   */
  processNode(node: Node) {
    switch (node.type) {
      case 'AssignOp':
        leftHandIdentifiers(node.assignee).forEach(identifier =>
          this.assigns(identifier.data, identifier)
        );
        break;

      case 'Function':
      case 'BoundFunction':
      case 'GeneratorFunction':
      case 'BoundGeneratorFunction':
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

      case 'Try':
        if (node.catchAssignee) {
          leftHandIdentifiers(node.catchAssignee).forEach(identifier =>
            this.assigns(identifier.data, identifier)
          );
        }
        break;

      case 'Class':
        if (node.nameAssignee && node.nameAssignee.type === 'Identifier') {
          this.assigns(node.nameAssignee.data, node.nameAssignee);
        }
        break;
    }
  }

  toString(): string {
    let parts = this.getOwnNames();
    if (this.parent) {
      parts.push(`parent = ${this.parent.toString()}`);
    }
    return `${this.constructor.name} {${parts.length > 0 ? ` ${parts.join(', ')} ` : ''}}`;
  }

  inspect(): string {
    return this.toString();
  }
}

/**
 * Gets all the identifiers representing bindings in `node`.
 */
function getBindingsForNode(node: Node): Array<Node> {
  switch (node.type) {
    case 'Function':
    case 'GeneratorFunction':
    case 'BoundFunction':
    case 'BoundGeneratorFunction':
      return flatMap(node.parameters, getBindingsForNode);

    case 'Identifier':
    case 'ArrayInitialiser':
    case 'ObjectInitialiser':
      return leftHandIdentifiers(node);

    case 'DefaultParam':
      return getBindingsForNode(node.param);

    case 'Rest':
      return getBindingsForNode(node.expression);

    case 'Expansion':
    case 'MemberAccessOp':
      return [];

    default:
      throw new Error(`unexpected parameter type: ${node.type}`);
  }
}
