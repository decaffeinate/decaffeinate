import determineIndent from '../utils/determineIndent';
import NodePatcher from './NodePatcher';
import { PatcherContext } from './types';

export default class ProgramPatcher extends NodePatcher {
  body: NodePatcher | null;
  helpers: Map<string, string> = new Map();
  _indentString: string | null = null;

  constructor(patcherContext: PatcherContext, body: NodePatcher | null) {
    super(patcherContext);
    this.body = body;
  }

  shouldTrimContentRange(): boolean {
    return true;
  }

  /**
   * Register a helper to be reused in several places.
   *
   * FIXME: Pick a different name than what is in scope.
   */
  registerHelper(name: string, code: string): string {
    code = code.trim();
    if (this.helpers.has(name)) {
      if (this.helpers.get(name) !== code) {
        throw new Error(`BUG: cannot override helper '${name}'`);
      }
    } else {
      this.helpers.set(name, code);
    }
    return name;
  }

  patchHelpers(): void {
    for (let helper of this.helpers.values()) {
      this.editor.append(`\n${helper}`);
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
