import MagicString from 'magic-string';
import NodePatcher from '../patchers/NodePatcher';
import PatchError from '../utils/PatchError';
import parse from '../utils/parse';
import type { Node, ParseContext, Editor } from '../patchers/types';
import { childPropertyNames } from '../utils/traverse';
import { logger } from '../utils/debug';
import type { Options } from '../index';

export default class TransformCoffeeScriptStage {
  static run(content: string, options: Options): { code: string } {
    let log = logger(this.name);
    log(content);

    let ast = parse(content);
    let editor = new MagicString(content);
    let stage = new this(ast, ast.context, editor, options);
    let patcher = stage.build();
    patcher.patch();
    return {
      code: editor.toString(),
    };
  }

  static get inputExtension() {
    return '.coffee';
  }

  static get outputExtension() {
    return '.js';
  }

  constructor(ast: Node, context: ParseContext, editor: Editor, options: Options) {
    this.ast = ast;
    this.context = context;
    this.editor = editor;
    this.options = options;
    this.root = null;
    this.patchers = [];
  }

  /**
   * This should be overridden in subclasses.
   */
  patcherConstructorForNode(node: Node): ?Class<NodePatcher> { // eslint-disable-line no-unused-vars
    return null;
  }

  build(): NodePatcher {
    this.root = this.patcherForNode(this.ast);
    // Note that initialize is called in bottom-up order.
    this.patchers.forEach(patcher => patcher.initialize());
    return this.root;
  }

  patcherForNode(node: Node, parent: ?Class<NodePatcher>=null, property: ?string=null): NodePatcher {
    let constructor = this._patcherConstructorForNode(node);

    if (parent) {
      let override = parent.patcherClassForChildNode(node, property);
      if (override) {
        constructor = override;
      }
    }

    let children = childPropertyNames(node).map(name => {
      let child = node[name];
      if (!child) {
        return null;
      } else if (Array.isArray(child)) {
        return child.map(item =>
          item ? this.patcherForNode(item, constructor, name) : null
        );
      } else {
        return this.patcherForNode(child, constructor, name);
      }
    });

    let patcherContext = {
      node,
      context: this.context,
      editor: this.editor,
      options: this.options
    };
    let patcher = new constructor(patcherContext, ...children);
    this.patchers.push(patcher);
    this.associateParent(patcher, children);

    return patcher;
  }

  associateParent(parent, child) {
    if (Array.isArray(child)) {
      child.forEach(item => this.associateParent(parent, item));
    } else if (child) {
      child.parent = parent;
    }
  }

  _patcherConstructorForNode(node: Node): Class<NodePatcher> {
    let constructor = this.patcherConstructorForNode(node);

    if (constructor === null) {
      let props = childPropertyNames(node);
      throw new PatchError(
        `no patcher available for node type: ${node.type}` +
        `${props.length ? ` (props: ${props.join(', ')})` : ''}`,
        this.context.source,
        ...node.range
      );
    }

    return constructor.patcherClassOverrideForNode(node) || constructor;
  }
}
