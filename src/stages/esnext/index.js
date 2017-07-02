import { allPlugins, convert } from 'esnext';
import { logger } from '../../utils/debug';
import type { Options, StageResult } from '../../index';

export default class EsnextStage {
  static run(content: string, options: Options): StageResult {
    let log = logger(this.name);
    log(content);
    let plugins = allPlugins;
    if (options.keepCommonJS) {
      plugins = plugins.filter(plugin => plugin.name !== 'modules.commonjs');
    }

    let { code } = convert(content, {
      plugins,
      'declarations.block-scope': {
        disableConst({ node, parent }): boolean {
          if (options.preferConst) {
            return false;
          }
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
        },
      },
      'modules.commonjs': {
        forceDefaultExport: options.forceDefaultExport,
        safeFunctionIdentifiers: options.safeImportFunctionIdentifiers,
      },
    });
    return {
      code,
      suggestions: [],
    };
  }
}
