import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import SharedProgramPatcher from '../../../patchers/SharedProgramPatcher';
import getIndent from '../../../utils/getIndent';
import notNull from '../../../utils/notNull';

const BLOCK_COMMENT_DELIMITER = '###';

export default class ProgramPatcher extends SharedProgramPatcher {
  canPatchAsExpression(): boolean {
    return false;
  }

  patchAsStatement(): void {
    this.patchComments();
    this.patchContinuations();
    if (this.body) {
      this.body.patch({ leftBrace: false, rightBrace: false });
    }
    this.patchHelpers();
  }

  /**
   * Removes continuation tokens (i.e. '\' at the end of a line).
   *
   * @private
   */
  patchContinuations(): void {
    this.getProgramSourceTokens().forEach(token => {
      if (token.type === SourceType.CONTINUATION) {
        this.remove(token.start, token.end);
      }
    });
  }

  /**
   * Replaces CoffeeScript style comments with JavaScript style comments.
   *
   * @private
   */
  patchComments(): void {
    const { source } = this.context;
    this.getProgramSourceTokens().forEach(token => {
      if (token.type === SourceType.COMMENT) {
        if (token.start === 0 && source[1] === '!') {
          this.patchShebangComment(token);
        } else {
          this.patchLineComment(token);
        }
      } else if (token.type === SourceType.HERECOMMENT) {
        this.patchBlockComment(token);
      }
    });
  }

  /**
   * Patches a block comment.
   *
   * @private
   */
  patchBlockComment(comment: SourceToken): void {
    const { start, end } = comment;
    this.overwrite(start, start + BLOCK_COMMENT_DELIMITER.length, '/*');

    let atStartOfLine = false;
    let lastStartOfLine = null;
    let lineUpAsterisks = true;
    let isMultiline = false;
    const { source } = this.context;
    const expectedIndent = getIndent(source, start);
    const leadingHashIndexes = [];

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
            if (source.slice(notNull(lastStartOfLine), index) !== expectedIndent) {
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
  patchLineComment(comment: SourceToken): void {
    const { start } = comment;
    this.overwrite(start, start + '#'.length, '//');
  }

  /**
   * Patches a shebang comment.
   *
   * @private
   */
  patchShebangComment(comment: SourceToken): void {
    const { start, end } = comment;
    const commentBody = this.slice(start, end);
    const coffeeIndex = commentBody.indexOf('coffee');

    if (coffeeIndex >= 0) {
      this.overwrite(start + coffeeIndex, start + coffeeIndex + 'coffee'.length, 'node');
    }
  }

  /**
   * Serve as the implicit return patcher for anyone not included in a function.
   */
  canHandleImplicitReturn(): boolean {
    return true;
  }
}
