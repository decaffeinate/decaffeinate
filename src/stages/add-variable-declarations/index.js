import addVariableDeclarations from 'add-variable-declarations';
import MagicString from 'magic-string';
import { basename } from 'path';

export default class AddVariableDeclarationsStage {
  static run(content: string, filename: string): { code: string, map: Object } {
    let editor = new MagicString(content);
    addVariableDeclarations(content, editor);
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
