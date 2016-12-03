import MagicString from 'magic-string';
import asi from 'automatic-semicolon-insertion';
import buildConfig from 'ast-processor-babylon-config';
import { basename } from 'path';
import { logger } from '../../utils/debug.js';
import { parse } from 'babylon';
import type { Options } from '../../index.js';

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
  static run(content: string, options: Options): { code: string, map: Object } {
    let { filename } = options;
    let log = logger(this.name);
    log(content);

    let editor = new MagicString(content);
    let ast = parse(content, { sourceType: 'module', plugins: BABYLON_PLUGINS });
    let config = buildConfig(content, ast);

    asi(config);

    config.insertions.forEach(({ index, content }) => editor.appendLeft(index, content));
    config.removals.forEach(({ start, end }) => editor.remove(start, end));

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
