import NodePatcher from './NodePatcher';
import type { PatcherContext } from './types';
import blank from '../utils/blank';
import determineIndent from '../utils/determineIndent';

export default class ProgramPatcher extends NodePatcher {
  body: ?NodePatcher;
  helpers: { [key: string]: string };
  _indentString: ?string;

  constructor(patcherContext: PatcherContext, body: ?NodePatcher) {
    super(patcherContext);
    this.body = body;

    this.helpers = blank();
    this._indentString = null;
  }

  shouldTrimContentRange() {
    return true;
  }

  /**
   * Register a helper to be reused in several places.
   *
   * FIXME: Pick a different name than what is in scope.
   */
  registerHelper(name: string, code: string): string {
    code = code.trim();
    if (name in this.helpers) {
      if (this.helpers[name] !== code) {
        throw new Error(`BUG: cannot override helper '${name}'`);
      }
    } else {
      this.helpers[name] = code;
    }
    return name;
  }

  patchHelpers() {
    for (let helper in this.helpers) {
      this.editor.append(`\n${this.helpers[helper]}`);
    }
  }

  /**
   * Gets the indent string used for each indent in this program.
   */
  getProgramIndentString(): string {
    if (!this._indentString) {
      this._indentString = determineIndent(this.context.source);
    }
    return this._indentString;
  }
}
