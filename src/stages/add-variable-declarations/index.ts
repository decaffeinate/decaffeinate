import addVariableDeclarations from 'add-variable-declarations';
import MagicString from 'magic-string';
import { StageResult } from '../../index';
import { logger } from '../../utils/debug';

export default class AddVariableDeclarationsStage {
  static run(content: string): StageResult {
    let log = logger(this.name);
    log(content);

    let editor = new MagicString(content);
    addVariableDeclarations(content, editor);
    return {
      code: editor.toString(),
      suggestions: []
    };
  }
}
