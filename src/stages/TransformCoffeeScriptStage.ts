import { Node } from 'decaffeinate-parser';
import MagicString from 'magic-string';
import { StageResult } from '../index';
import { Options } from '../options';
import NodePatcher, { PatcherClass } from '../patchers/NodePatcher';
import { Suggestion } from '../suggestions';
import { logger } from '../utils/debug';
import DecaffeinateContext from '../utils/DecaffeinateContext';
import notNull from '../utils/notNull';
import PatchError from '../utils/PatchError';

export type ChildType = NodePatcher | Array<NodePatcher | null> | null;

export default class TransformCoffeeScriptStage {
  static run(content: string, options: Options): StageResult {
    const log = logger(this.name);
    log(content);

    const context = DecaffeinateContext.create(content, Boolean(options.useCS2));
    const editor = new MagicString(content);
    const stage = new this(context.programNode, context, editor, options);
    const patcher = stage.build();
    patcher.patch();
    return {
      code: editor.toString(),
      suggestions: stage.suggestions,
    };
  }

  root: NodePatcher | null = null;
  patchers: Array<NodePatcher> = [];
  suggestions: Array<Suggestion> = [];

  constructor(
    readonly ast: Node,
    readonly context: DecaffeinateContext,
    readonly editor: MagicString,
    readonly options: Options,
  ) {}

  /**
   * This should be overridden in subclasses.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  patcherConstructorForNode(_node: Node): PatcherClass | null {
    return null;
  }

  build(): NodePatcher {
    this.root = this.patcherForNode(this.ast);
    // Note that initialize is called in bottom-up order.
    this.patchers.forEach((patcher) => patcher.initialize());
    return this.root;
  }

  patcherForNode(node: Node, parent: PatcherClass | null = null, property: string | null = null): NodePatcher {
    let constructor = this._patcherConstructorForNode(node);

    if (parent) {
      const override = parent.patcherClassForChildNode(node, notNull(property));
      if (override) {
        constructor = override;
      }
    }

    const children: Array<ChildType> = node.getChildNames().map((name) => {
      const child = node[name as keyof typeof node];
      if (!child) {
        return null;
      } else if (Array.isArray(child)) {
        return child.map((item) => (item ? this.patcherForNode(item as Node, constructor, name) : null));
      } else {
        return this.patcherForNode(child as Node, constructor, name);
      }
    });

    const patcherContext = {
      node,
      context: this.context,
      editor: this.editor,
      options: this.options,
      addSuggestion: (suggestion: Suggestion) => {
        this.suggestions.push(suggestion);
      },
    };
    const patcher = new constructor(patcherContext, ...children);
    this.patchers.push(patcher);
    this.associateParent(patcher, children);

    return patcher;
  }

  associateParent(parent: NodePatcher, child: Array<ChildType> | NodePatcher | null): void {
    if (Array.isArray(child)) {
      child.forEach((item) => this.associateParent(parent, item));
    } else if (child) {
      child.parent = parent;
    }
  }

  _patcherConstructorForNode(node: Node): PatcherClass {
    const constructor = this.patcherConstructorForNode(node);

    if (constructor === null) {
      const props = node.getChildNames();
      throw new PatchError(
        `no patcher available for node type: ${node.type}` + `${props.length ? ` (props: ${props.join(', ')})` : ''}`,
        this.context.source,
        node.start,
        node.end,
      );
    }

    return constructor.patcherClassOverrideForNode(node) || constructor;
  }
}
