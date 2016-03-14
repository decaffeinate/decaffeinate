import { basename } from 'path';
import { convert } from 'esnext';
import { logger } from '../../utils/debug.js';
import { parse } from 'babel-eslint';

export default class EsnextStage {
  static run(content: string, filename: string): { code: string, map: Object } {
    let log = logger(this.name);
    log(content);

    let { code, map } = convert(content, {
      parse,
      'declarations.block-scope': {
        disableConst: true
      }
    });
    map.file = `${basename(filename, '.js')}-${this.name}.js`;
    return { code, map };
  }
}
