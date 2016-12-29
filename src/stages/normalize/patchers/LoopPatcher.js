import { SourceType } from 'coffee-lex';
import NodePatcher from '../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

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
  body: NodePatcher;

  constructor(patcherContext: PatcherContext, body: NodePatcher) {
    super(patcherContext);
    this.body = body;
  }

  patchAsExpression() {
    let loop = this.firstToken();

    if (loop.type !== SourceType.LOOP) {
      throw this.error(`expected first token of loop to be LOOP, but got: ${SourceType[loop.type]}`);
    }

    this.overwrite(loop.start, loop.end, 'while true');
    this.body.patch();
  }
}
