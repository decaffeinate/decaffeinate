import { parse } from '@codemod/parser';
import asi from 'automatic-semicolon-insertion';
import MagicString from 'magic-string';
import { StageResult } from '../../index';
import { logger } from '../../utils/debug';

export default class SemicolonsStage {
  static run(content: string): StageResult {
    let log = logger(this.name);
    log(content);

    let editor = new MagicString(content);
    let ast = parse(content, {
      tokens: true
    });

    const { insertions, removals } = asi(content, ast);

    insertions.forEach(({ index, content }) => editor.appendLeft(index, content));
    removals.forEach(({ start, end }) => editor.remove(start, end));

    return {
      code: editor.toString(),
      suggestions: []
    };
  }
}
