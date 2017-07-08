import { SourceType } from 'coffee-lex';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import BlockPatcher from './BlockPatcher';

/**
 * Normalizes `loop` loops by rewriting into standard `while`, e.g.
 *
 *   loop
 *     b()
 *
 * becomes
 *
 *   while true
 *     b()
 */
export default class LoopPatcher extends NodePatcher {
  body: BlockPatcher;

  constructor(patcherContext: PatcherContext, body: BlockPatcher) {
    super(patcherContext);
    this.body = body;
  }

  patchAsExpression(): void {
    let loop = this.firstToken();
    let next = this.sourceTokenAtIndex(notNull(this.contentStartTokenIndex.next()));
    if (!next) {
      throw this.error('Expected to find a next token.');
    }

    if (loop.type !== SourceType.LOOP) {
      throw this.error(`expected first token of loop to be LOOP, but got: ${SourceType[loop.type]}`);
    }

    if (next.type === SourceType.THEN || !this.body.node.inline) {
      this.overwrite(loop.start, loop.end, 'while true');
    } else {
      this.overwrite(loop.start, loop.end, 'while true then');
    }

    if (this.body) {
      this.body.patch();
    }
  }
}
