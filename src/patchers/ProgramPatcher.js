import NodePatcher from './NodePatcher.js';
import blank from '../utils/blank.js';
import determineIndent from '../utils/determineIndent.js';
import getIndent from '../utils/getIndent.js';
import rangesOfComments from '../utils/rangesOfComments.js';
import type BlockPatcher from './BlockPatcher.js';
import type { Editor, Node, ParseContext } from './types.js';

const BLOCK_COMMENT_DELIMITER = '###';

type Comment = {
  type: 'line' | 'block' | 'shebang',
  start: number,
  end: number
};

export default class ProgramPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, body: BlockPatcher) {
    super(node, context, editor);
    this.body = body;

    this.helpers = blank();
    this._indentString = null;
  }

  /**
   * @protected
   */
  canPatchAsExpression(): boolean {
    return false;
  }

  patchAsStatement() {
    this.body.patch({ leftBrace: false, rightBrace: false });
    this.patchComments();

    for (let helper in this.helpers) {
      this.editor.append(`\n${this.helpers[helper]}`);
    }
  }

  /**
   * Replaces CoffeeScript style comments with JavaScript style comments.
   *
   * @private
   */
  patchComments() {
    let { source } = this.context;
    let ranges = rangesOfComments(source);

    ranges.forEach(comment => {
      switch (comment.type) {
        case 'line':
          this.patchLineComment(comment);
          break;

        case 'block':
          this.patchBlockComment(comment);
          break;

        case 'shebang':
          this.patchShebangComment(comment);
          break;
      }
    });
  }

  /**
   * Patches a block comment.
   *
   * @private
   */
  patchBlockComment(comment: Comment) {
    let { start, end } = comment;
    this.overwrite(start, start + BLOCK_COMMENT_DELIMITER.length, '/*');

    let atStartOfLine = false;
    let lastStartOfLine = null;
    let lineUpAsterisks = true;
    let isMultiline = false;
    let { source } = this.context;
    let expectedIndent = getIndent(source, start);
    let leadingHashIndexes = [];

    for (let index = start + BLOCK_COMMENT_DELIMITER.length; index < end - BLOCK_COMMENT_DELIMITER.length; index++) {
      switch (source[index]) {
        case '\n':
          isMultiline = true;
          atStartOfLine = true;
          lastStartOfLine = index + '\n'.length;
          break;

        case ' ':
        case '\t':
          break;

        case '#':
          if (atStartOfLine) {
            leadingHashIndexes.push(index);
            atStartOfLine = false;
            if (source.slice(lastStartOfLine, index) !== expectedIndent) {
              lineUpAsterisks = false;
            }
          }
          break;

        default:
          if (atStartOfLine) {
            atStartOfLine = false;
            lineUpAsterisks = false;
          }
          break;
      }
    }

    leadingHashIndexes.forEach(index => {
      this.overwrite(index, index + '#'.length, lineUpAsterisks ? ' *' : '*');
    });

    this.overwrite(end - BLOCK_COMMENT_DELIMITER.length, end, isMultiline && lineUpAsterisks ? ' */' : '*/');
  }

  /**
   * Patches a single-line comment.
   *
   * @private
   */
  patchLineComment(comment: Comment) {
    let { start } = comment;
    this.overwrite(start, start + '#'.length, '//');
  }

  /**
   * Patches a shebang comment.
   *
   * @private
   */
  patchShebangComment(comment: Comment) {
    let { start, end } = comment;
    let commentBody = this.slice(start, end);
    let coffeeIndex = commentBody.indexOf('coffee');

    if (coffeeIndex >= 0) {
      this.overwrite(
        start + coffeeIndex,
        start + coffeeIndex + 'coffee'.length,
        'node'
      );
    }
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

