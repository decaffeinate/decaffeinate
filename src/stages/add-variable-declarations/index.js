import addVariableDeclarations from 'add-variable-declarations';
import MagicString from 'magic-string';
import { basename } from 'path';
import { logger } from '../../utils/debug.js';

export default class AddVariableDeclarationsStage {
  static run(content: string, filename: string): { code: string, map: Object } {
    let log = logger(this.name);
    log(content);

    let editor = new MagicString(content);
    try {
      addVariableDeclarations(content, editor);
    } catch (err) {
      if (err.loc) {
        let {line, column} = err.loc;
        let lines = content.split('\n');
        let l = '-'.repeat(column) + '^';
        lines.splice(line, 0, l, '').join('\n');
        content = lines.join('\n');
      }
      err.message += '\n' + content;
      throw(err);
    }
    return {
      code: editor.toString(),
      map: editor.generateMap({
        source: filename,
        file: `${basename(filename, '.js')}-${this.name}.js`,
        includeContent: true
      })
    };
  }
}
