import NodePatcher from './../../../patchers/NodePatcher.js';
import blank from '../../../utils/blank.js';
import determineIndent from '../../../utils/determineIndent.js';
import getIndent from '../../../utils/getIndent.js';
import { COMMENT, HERECOMMENT} from 'coffee-lex';
import type BlockPatcher from './BlockPatcher.js';
import type { Editor, Node, ParseContext, SourceToken } from './../../../patchers/types.js';

const BLOCK_COMMENT_DELIMITER = '###';

export default class ProgramPatcher extends NodePatcher {
  body: BlockPatcher;
  helpers: { [key: string]: string };
  _indentString: ?string;

  constructor(node: Node, context: ParseContext, editor: Editor, body: BlockPatcher) {
    super(node, context, editor);
    this.body = body;

    this.helpers = blank();
    this._indentString = null;
  }

  shouldTrimContentRange() {
    return true;
  }

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
    this.getProgramSourceTokens().forEach(token => {
      if (token.type === COMMENT) {
        if (token.start === 0 && source[1] === '!') {
          this.patchShebangComment(token);
        } else {
          this.patchLineComment(token);
        }
      } else if (token.type === HERECOMMENT) {
        this.patchBlockComment(token);
      }
    });
  }

  /**
   * Patches a block comment.
   *
   * @private
   */
  patchBlockComment(comment: SourceToken) {
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
  patchLineComment(comment: SourceToken) {
    let { start } = comment;
    this.overwrite(start, start + '#'.length, '//');
  }

  /**
   * Patches a shebang comment.
   *
   * @private
   */
  patchShebangComment(comment: SourceToken) {
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

  /**
   * Serve as the implicit return patcher for anyone not included in a function.
   */
  implicitReturnPatcher(): NodePatcher {
    return this;
  }

  /**
   * Serve as the default for anyone not included in a function.
   */
  implicitReturnWillBreak(): boolean {
    return true;
  }
}

