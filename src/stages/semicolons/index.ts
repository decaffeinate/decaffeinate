import { parse, ParserPlugin } from '@babel/parser';
import asi from 'automatic-semicolon-insertion';
import MagicString from 'magic-string';
import { StageResult } from '../../index';
import { logger } from '../../utils/debug';

const BABYLON_PLUGINS: Array<ParserPlugin> = [
  'flow',
  'jsx',
  'asyncGenerators',
  'classProperties',
  ['decorators', { decoratorsBeforeExport: true }] as any, // tslint:disable-line no-any
  'doExpressions',
  'functionBind',
  'functionSent',
  'objectRestSpread',
  'optionalChaining'
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
      tokens: true
    });

    const { insertions, removals } = asi(content, ast);

    insertions.forEach(({ index, content }) => editor.appendLeft(index, content));
    removals.forEach(({ start, end }) => editor.remove(start, end));

    return {
      code: editor.toString(),
      suggestions: []
    };
  }
}
