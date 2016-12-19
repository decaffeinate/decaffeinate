import NodePatcher from './NodePatcher';
import type { PatcherContext } from './types';

export default class PassthroughPatcher extends NodePatcher {
  children: Array<?NodePatcher|Array<?NodePatcher>>;
  
  constructor(patcherContext: PatcherContext, ...children: Array<?NodePatcher|Array<?NodePatcher>>) {
    super(patcherContext);
    this.children = children;
  }

  patch() {
    this.withPrettyErrors(() => {
      this.children.forEach(child => {
        if (Array.isArray(child)) {
          child.forEach(child => child && child.patch());
        } else if (child) {
          child.patch();
        }
      });
    });
  }

  isRepeatable(): boolean {
    return true;
  }
}
