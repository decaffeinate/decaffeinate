import SourceType from 'coffee-lex/dist/SourceType';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import StringPatcher from './StringPatcher';

export default class CSXElementPatcher extends NodePatcher {
  properties: Array<NodePatcher>;
  children: Array<NodePatcher | null>;

  constructor(patcherContext: PatcherContext, properties: Array<NodePatcher>, children: Array<NodePatcher | null>) {
    super(patcherContext);
    this.properties = properties;
    this.children = children;
  }

  initialize(): void {
    for (const property of this.properties) {
      property.setRequiresExpression();
    }
    for (const child of this.children) {
      if (child) {
        child.setRequiresExpression();
      }
    }
  }

  patchAsExpression(): void {
    for (const property of this.properties) {
      if (property instanceof StringPatcher && property.expressions.length > 0) {
        this.patchStringProperty(property);
      } else {
        property.patch();
      }
    }
    for (const child of this.children) {
      if (child) {
        child.patch();
      }
    }
  }

  /**
   * Patch a property that is definitely a string and may or may not already be surrounded by braces.
   */
  patchStringProperty(property: NodePatcher): void {
    let prevIndex = property.contentStartTokenIndex.previous();
    if (!prevIndex) {
      throw this.error('Expected index before string property.');
    }
    let prevToken = this.sourceTokenAtIndex(prevIndex);
    if (
      prevToken &&
      prevToken.type === SourceType.OPERATOR &&
      this.context.source.slice(prevToken.start, prevToken.end) === '='
    ) {
      this.insert(property.outerStart, '{');
      property.patch();
      this.insert(property.outerEnd, '}');
    } else {
      property.patch();
    }
  }
}
