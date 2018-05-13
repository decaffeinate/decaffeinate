import { NodePath } from 'babel-traverse';
import { Identifier, VariableDeclaration } from 'babel-types';
import { allPlugins, convert } from 'esnext';
import { StageResult } from '../../index';
import { Options } from '../../options';
import { logger } from '../../utils/debug';

export default class EsnextStage {
  static run(content: string, options: Options): StageResult {
    let log = logger(this.name);
    log(content);
    let plugins = allPlugins;
    if (!options.useJSModules) {
      plugins = plugins.filter(plugin => plugin.name !== 'modules.commonjs');
    }

    let { code } = convert(content, {
      plugins,
      'declarations.block-scope': {
        disableConst({ node, parent }: NodePath<VariableDeclaration>): boolean {
          if (options.preferLet) {
            return (
              // Only use `const` for top-level variables…
              (parent && parent.type !== 'Program') ||
              // … as the only variable in its declaration …
              node.declarations.length !== 1 ||
              // … without any sort of destructuring …
              node.declarations[0].id.type !== 'Identifier' ||
              // … starting with a capital letter.
              !/^[$_]?[A-Z]+$/.test((node.declarations[0].id as Identifier).name)
            );
          } else {
            return false;
          }
        }
      },
      'modules.commonjs': {
        forceDefaultExport: !options.looseJSModules,
        safeFunctionIdentifiers: options.safeImportFunctionIdentifiers
      }
    });
    return {
      code,
      suggestions: []
    };
  }
}
