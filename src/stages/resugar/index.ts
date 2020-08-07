import * as t from '@babel/types';
import declarationsBlockScope from '@resugar/codemod-declarations-block-scope';
import functionsArrow from '@resugar/codemod-functions-arrow';
import modulesCommonjs from '@resugar/codemod-modules-commonjs';
import objectsConcise from '@resugar/codemod-objects-concise';
import objectsDestructuring from '@resugar/codemod-objects-destructuring';
import objectsShorthand from '@resugar/codemod-objects-shorthand';
import stringsTemplate from '@resugar/codemod-strings-template';
import { Options } from '../../options';
import { PluginItem, NodePath } from '@babel/core';
import { StageResult } from '../../index';
import { logger } from '../../utils/debug';
import { transform } from '@codemod/core';

export default class ResugarStage {
  static run(content: string, options: Options): StageResult {
    const log = logger(this.name);
    log(content);

    const code = transform(content, {
      plugins: Array.from(this.getPluginsForOptions(options)),
    }).code as string;

    return {
      code,
      suggestions: [],
    };
  }

  private static *getPluginsForOptions(options: Options): Iterable<PluginItem> {
    yield objectsShorthand;
    yield objectsConcise;

    if (options.useJSModules) {
      yield [
        modulesCommonjs,
        {
          forceDefaultExport: !options.looseJSModules,
          safeFunctionIdentifiers: options.safeImportFunctionIdentifiers,
        },
      ];
    }

    yield functionsArrow;

    yield [
      declarationsBlockScope,
      {
        disableConst({ node, parent }: NodePath<t.VariableDeclaration>): boolean {
          if (options.preferLet) {
            return (
              // Only use `const` for top-level variables…
              !t.isProgram(parent) ||
              // … as the only variable in its declaration …
              node.declarations.length !== 1 ||
              // … without any sort of destructuring …
              !t.isIdentifier(node.declarations[0].id) ||
              // … starting with a capital letter.
              !/^[$_]?[A-Z]+$/.test(node.declarations[0].id.name)
            );
          } else {
            return false;
          }
        },
      },
    ];

    yield objectsDestructuring;
    yield stringsTemplate;
  }
}
