import lex from 'coffee-lex';
import { nodes as getCoffeeNodes, tokens as getCoffeeTokens } from 'decaffeinate-coffeescript';
import {parse as decaffeinateParse} from 'decaffeinate-parser';
import AddVariableDeclarationsStage from './stages/add-variable-declarations/index';
import EsnextStage from './stages/esnext/index';
import LiterateStage from './stages/literate/index';
import MainStage from './stages/main/index';
import NormalizeStage from './stages/normalize/index';
import SemicolonsStage from './stages/semicolons/index';
import { mergeSuggestions, prependSuggestionComment, Suggestion } from './suggestions';
import CodeContext from './utils/CodeContext';
import convertNewlines from './utils/convertNewlines';
import detectNewlineStr from './utils/detectNewlineStr';
import formatCoffeeLexAst from './utils/formatCoffeeLexTokens';
import formatCoffeeScriptAst from './utils/formatCoffeeScriptAst';
import formatCoffeeScriptLexerTokens from './utils/formatCoffeeScriptLexerTokens';
import formatDecaffeinateParserAst from './utils/formatDecaffeinateParserAst';
import PatchError from './utils/PatchError';
import removeUnicodeBOMIfNecessary from './utils/removeUnicodeBOMIfNecessary';
import resolveToPatchError from './utils/resolveToPatchError';

export { default as run } from './cli';
import { DEFAULT_OPTIONS, Options } from './options';
import notNull from './utils/notNull';
export { PatchError };

export type ConversionResult = {
  code: string,
};

export type StageResult = {
  code: string,
  suggestions: Array<Suggestion>,
};

type Stage = {
  name: string,
  run: (content: string, options: Options) => StageResult,
};

/**
 * Convert CoffeeScript source code into modern JavaScript preserving comments
 * and formatting.
 */
export function convert(source: string, options: Options = {}): ConversionResult {
  source = removeUnicodeBOMIfNecessary(source);
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  let originalNewlineStr = detectNewlineStr(source);
  source = convertNewlines(source, '\n');

  let literate = options.literate ||
    notNull(options.filename).endsWith('.litcoffee') ||
    notNull(options.filename).endsWith('.coffee.md');
  let stages = [
    ...(literate ? [LiterateStage] : []),
    NormalizeStage,
    MainStage,
    AddVariableDeclarationsStage,
    SemicolonsStage,
    EsnextStage
  ];
  let runToStage = options.runToStage;
  if (runToStage !== null && runToStage !== undefined) {
    let stageIndex = stages.findIndex(stage => stage.name === runToStage);
    if (stageIndex !== -1) {
      stages = stages.slice(0, stageIndex + 1);
    } else {
      return convertCustomStage(source, runToStage);
    }
  }
  let result = runStages(source, options, stages);
  if (!options.disableSuggestionComment) {
    result.code = prependSuggestionComment(result.code, result.suggestions);
  }
  result.code = convertNewlines(result.code, originalNewlineStr);
  return {
    code: result.code,
  };
}

export function modernizeJS(source: string, options: Options = {}): ConversionResult {
  source = removeUnicodeBOMIfNecessary(source);
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  let originalNewlineStr = detectNewlineStr(source);
  source = convertNewlines(source, '\n');
  let stages = [
    EsnextStage
  ];
  let result = runStages(source, options, stages);
  result.code = convertNewlines(result.code, originalNewlineStr);
  return {
    code: result.code,
  };
}

function runStages(initialContent: string, options: Options, stages: Array<Stage>): StageResult {
  let content = initialContent;
  let suggestions: Array<Suggestion> = [];
  stages.forEach(stage => {
    let { code, suggestions: stageSuggestions } = runStage(stage, content, options);
    content = code;
    suggestions.push(...stageSuggestions);
  });
  return { code: content, suggestions: mergeSuggestions(suggestions) };
}

function runStage(stage: Stage, content: string, options: Options): StageResult {
  try {
    return stage.run(content, options);
  } catch (err) {
    let patchError = resolveToPatchError(err, content, stage.name);
    if (patchError !== null) {
      throw patchError;
    }
    throw err;
  }
}

function convertCustomStage(source: string, stageName: string): ConversionResult {
  let context = new CodeContext(source);
  if (stageName === 'coffeescript-lexer') {
    return {
      code: formatCoffeeScriptLexerTokens(getCoffeeTokens(source), context),
    };
  } else if (stageName === 'coffeescript-parser') {
    return {
      code: formatCoffeeScriptAst(getCoffeeNodes(source), context),
    };
  } else if (stageName === 'coffee-lex') {
    return {
      code: formatCoffeeLexAst(lex(source), context),
    };
  } else if (stageName === 'decaffeinate-parser') {
    return {
      code: formatDecaffeinateParserAst(decaffeinateParse(source), context),
    };
  } else {
    throw new Error(`Unrecognized stage name: ${stageName}`);
  }
}
