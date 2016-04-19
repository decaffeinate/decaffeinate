import { basename } from 'path';
import { convert } from 'esnext';
import { logger } from '../../utils/debug.js';

export default class EsnextStage {
  static run(content: string, filename: string): { code: string, map: Object } {
    let log = logger(this.name);
    log(content);

    let { code, map } = convert(content, {
      'declarations.block-scope': {
        disableConst({ node, parent }): boolean {
          return (
            // Only use `const` for top-level variables…
            parent && parent.type !== 'Program' ||
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
