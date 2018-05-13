import NodePatcher from './NodePatcher';
import { PatcherContext } from './types';

export default class PassthroughPatcher extends NodePatcher {
  children: Array<NodePatcher | Array<NodePatcher> | null>;

  constructor(patcherContext: PatcherContext, ...children: Array<NodePatcher | Array<NodePatcher> | null>) {
    super(patcherContext);
    this.children = children;
  }

  patchAsExpression(): void {
    this.children.forEach(child => {
      if (Array.isArray(child)) {
        child.forEach(child => child && child.patch());
      } else if (child) {
        child.patch();
      }
    });
  }

  isRepeatable(): boolean {
    return true;
  }
}
