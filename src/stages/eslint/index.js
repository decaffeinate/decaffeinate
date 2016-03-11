import MagicString from 'magic-string';
import { basename } from 'path';
import { linter } from 'eslint';
import { logger } from '../../utils/debug.js';

export default class EslintStage {
  static run(content: string, filename: string): { code: string, map: Object } {
    let log = logger(this.name);
    log(content);

    let editor = new MagicString(content);
    let messages = linter.verify(content, {
      rules: { 'semi': 2, 'no-extra-semi': 2 },
      env: { es6: true }
    });

    messages.forEach(message => {
      switch (message.ruleId) {
        case 'semi':
          editor.insert(message.fix.range[1], message.fix.text);
          break;

        case 'no-extra-semi':
          editor.overwrite(...message.fix.range, message.fix.text);
          break;
      }
    });

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
