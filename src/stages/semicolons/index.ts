import { Insertion, Removal } from 'ast-processor-babylon-config-types';
const buildConfig = require('ast-processor-babylon-config');
const asi = require('automatic-semicolon-insertion');
import { parse, PluginName } from 'babylon';
import MagicString from 'magic-string';
import { StageResult } from '../../index';
import { logger } from '../../utils/debug';

const BABYLON_PLUGINS: Array<PluginName> = [
  'flow',
  'jsx',
  'asyncGenerators',
  'classConstructorCall',
  'classProperties',
  'decorators',
  'doExpressions',
  'exportExtensions',
  'functionBind',
  'functionSent',
  'objectRestSpread',
  'optionalChaining' as any,  // tslint:disable-line no-any
];

export default class SemicolonsStage {
  static run(content: string): StageResult {
    let log = logger(this.name);
    log(content);

    let editor = new MagicString(content);
    let ast = parse(content, {
      sourceType: 'module',
      plugins: BABYLON_PLUGINS,
      allowReturnOutsideFunction: true,
      tokens: true,
    } as any);  // tslint:disable-line no-any
    let config = buildConfig(content, ast);

    asi(config);

    config.insertions.forEach(({ index, content }: Insertion) => editor.appendLeft(index, content));
    config.removals.forEach(({ start, end }: Removal) => editor.remove(start, end));

    return {
      code: editor.toString(),
      suggestions: [],
    };
  }
}
