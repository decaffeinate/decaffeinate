import { parse } from '@codemod/parser';
import * as asi from 'automatic-semicolon-insertion';
import MagicString from 'magic-string';
import { StageResult } from '../../index';
import { logger } from '../../utils/debug';

export default class SemicolonsStage {
  static run(content: string): StageResult {
    const log = logger(this.name);
    log(content);

    const editor = new MagicString(content);
    const ast = parse(content, {
      tokens: true,
    });

    const { insertions, removals } = asi.process(content, ast);

    insertions.forEach(({ index, content }) => editor.appendLeft(index, content));
    removals.forEach(({ start, end }) => editor.remove(start, end));

    return {
      code: editor.toString(),
      suggestions: [],
    };
  }
}
