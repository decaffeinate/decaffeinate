import {
  ArrayInitialiser,
  AssignOp,
  BaseFunction,
  Class,
  CompoundAssignOp,
  DefaultParam,
  Expansion,
  For,
  Identifier,
  MemberAccessOp,
  Node,
  ObjectInitialiser,
  PostDecrementOp,
  PostIncrementOp,
  PreDecrementOp,
  PreIncrementOp,
  Rest,
  Try
} from 'decaffeinate-parser/dist/nodes';
import flatMap from './flatMap';
import isReservedWord from './isReservedWord';
import leftHandIdentifiers from './leftHandIdentifiers';

type Bindings = { [key: string]: Node };

/**
 * Represents a CoffeeScript scope and its bindings.
 */
export default class Scope {
  private bindings: Bindings;
  private modificationsAfterDeclaration: { [key: string]: boolean };
  private innerClosureModifications: { [key: string]: boolean };

  constructor(readonly containerNode: Node, readonly parent: Scope | null = null) {
    this.bindings = Object.create(parent ? parent.bindings : {});
    this.modificationsAfterDeclaration = {};
    this.innerClosureModifications = {};
  }

  getBinding(name: string): Node | null {
    return this.bindings[this.key(name)] || null;
  }

  isBindingAvailable(name: string): boolean {
    return !this.getBinding(name) && !isReservedWord(name);
  }

  hasBinding(name: string): boolean {
    return this.getBinding(name) !== null;
  }

  hasModificationAfterDeclaration(name: string): boolean {
    return this.modificationsAfterDeclaration[this.key(name)] || false;
  }

  hasInnerClosureModification(name: string): boolean {
    return this.innerClosureModifications[this.key(name)] || false;
  }

  getOwnNames(): Array<string> {
    return Object.getOwnPropertyNames(this.bindings).map(key => this.unkey(key));
  }

  hasOwnBinding(name: string): boolean {
    return this.bindings.hasOwnProperty(this.key(name));
  }

  /**
   * Mark that the given name is explicitly declared, e.g. in a parameter.
   */
  declares(name: string, node: Node): void {
    let key = this.key(name);
    this.bindings[key] = node;
  }

  /**
   * Mark that the given name is part of an assignment. This might introduce a
   * new variable or might set an existing variable, depending on context.
   */
  assigns(name: string, node: Node): void {
    if (!this.bindings[this.key(name)]) {
      // Not defined in this or any parent scope.
      this.declares(name, node);
    } else {
      this.modifies(name);
    }
  }

  /**
   * Mark that the given name is part of a modification, e.g. `+=` or `++`.
   */
  modifies(name: string): void {
    let scope: Scope | null = this;
    while (scope) {
      if (scope.hasOwnBinding(name)) {
        scope.modificationsAfterDeclaration[this.key(name)] = true;
        if (scope !== this) {
          scope.innerClosureModifications[this.key(name)] = true;
        }
        break;
      }
      scope = scope.parent;
    }
  }

  claimFreeBinding(node: Node, name: string | Array<string> | null = null): string {
    if (!name) {
      name = 'ref';
    }
    let names = Array.isArray(name) ? name : [name];
    let binding = names.find(name => this.isBindingAvailable(name));

    if (!binding) {
      let counter = 0;
      while (!binding) {
        if (counter > 1000) {
          throw new Error(`Unable to find free binding for names ${names.toString()}`);
        }
        counter += 1;
        binding = names.find(name => this.isBindingAvailable(`${name}${counter}`));
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
  processNode(node: Node): void {
    if (node instanceof AssignOp) {
      leftHandIdentifiers(node.assignee).forEach(identifier => this.assigns(identifier.data, identifier));
    } else if (node instanceof CompoundAssignOp) {
      if (node.assignee instanceof Identifier) {
        this.modifies(node.assignee.data);
      }
    } else if (
      node instanceof PostDecrementOp ||
      node instanceof PostIncrementOp ||
      node instanceof PreDecrementOp ||
      node instanceof PreIncrementOp
    ) {
      if (node.expression instanceof Identifier) {
        this.modifies(node.expression.data);
      }
    } else if (node instanceof BaseFunction) {
      getBindingsForNode(node).forEach(identifier => this.declares(identifier.data, identifier));
    } else if (node instanceof For) {
      [node.keyAssignee, node.valAssignee].forEach(assignee => {
        if (assignee) {
          leftHandIdentifiers(assignee).forEach(identifier => this.assigns(identifier.data, identifier));
        }
      });
    } else if (node instanceof Try) {
      if (node.catchAssignee) {
        leftHandIdentifiers(node.catchAssignee).forEach(identifier => this.assigns(identifier.data, identifier));
      }
    } else if (node instanceof Class) {
      if (node.nameAssignee && node.nameAssignee instanceof Identifier && this.parent) {
        // Classes have their own scope, but their name is bound to the parent scope.
        this.parent.assigns(node.nameAssignee.data, node.nameAssignee);
      }
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
function getBindingsForNode(node: Node): Array<Identifier> {
  if (node instanceof BaseFunction) {
    return flatMap(node.parameters, getBindingsForNode);
  } else if (node instanceof Identifier || node instanceof ArrayInitialiser || node instanceof ObjectInitialiser) {
    return leftHandIdentifiers(node);
  } else if (node instanceof DefaultParam) {
    return getBindingsForNode(node.param);
  } else if (node instanceof Rest) {
    return getBindingsForNode(node.expression);
  } else if (node instanceof Expansion || node instanceof MemberAccessOp) {
    return [];
  } else {
    throw new Error(`unexpected parameter type: ${node.type}`);
  }
}
