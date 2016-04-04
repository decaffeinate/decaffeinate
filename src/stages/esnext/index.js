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
        disableConst(node: Object): boolean {
          return (
            // Only use `const` for top-level variables…
            node.parentNode.type !== 'Program' ||
            // … as the only variable in its declaration …
            node.declarations.length !== 1 ||
            // … without any sort of destructuring …
            node.declarations[0].id.type !== 'Identifier' ||
            // … starting with a capital letter.
            !/^[$_]?[A-Z]+$/.test(node.declarations[0].id.name)
          );
        }
      }
    });
    map.file = `${basename(filename, '.js')}-${this.name}.js`;
    return { code, map };
  }
}
