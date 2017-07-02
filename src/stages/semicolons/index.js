import MagicString from 'magic-string';
import asi from 'automatic-semicolon-insertion';
import buildConfig from 'ast-processor-babylon-config';
import { logger } from '../../utils/debug';
import { parse } from 'babylon';

import type { StageResult } from '../../index';

const BABYLON_PLUGINS = [
  'flow',
  'jsx',
  'asyncFunctions',
  'asyncGenerators',
  'classConstructorCall',
  'classProperties',
  'decorators',
  'doExpressions',
  'exponentiationOperator',
  'exportExtensions',
  'functionBind',
  'functionSent',
  'objectRestSpread',
  'trailingFunctionCommas'
];

export default class SemicolonsStage {
  static run(content: string): StageResult {
    let log = logger(this.name);
    log(content);

    let editor = new MagicString(content);
    let ast = parse(content, {
      sourceType: 'module',
      plugins: BABYLON_PLUGINS,
      allowReturnOutsideFunction: true
    });
    let config = buildConfig(content, ast);

    asi(config);

    config.insertions.forEach(({ index, content }) => editor.appendLeft(index, content));
    config.removals.forEach(({ start, end }) => editor.remove(start, end));

    return {
      code: editor.toString(),
      suggestions: [],
    };
  }
}
