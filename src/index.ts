import lex from 'coffee-lex';
import { nodes as getCoffee1Nodes, tokens as getCoffee1Tokens } from 'decaffeinate-coffeescript';
import { nodes as getCoffee2Nodes, tokens as getCoffee2Tokens } from 'decaffeinate-coffeescript2';
import { parse as decaffeinateParse } from 'decaffeinate-parser';
import AddVariableDeclarationsStage from './stages/add-variable-declarations/index';
import ResugarStage from './stages/resugar/index';
import LiterateStage from './stages/literate/index';
import MainStage from './stages/main/index';
import NormalizeStage from './stages/normalize/index';
import SemicolonsStage from './stages/semicolons/index';
import { mergeSuggestions, prependSuggestionComment, Suggestion } from './suggestions';
import CodeContext from './utils/CodeContext';
import convertNewlines from './utils/convertNewlines';
import detectNewlineStr from './utils/detectNewlineStr';
import formatCoffeeLexTokens from './utils/formatCoffeeLexTokens';
import formatCoffeeScriptAst from './utils/formatCoffeeScriptAst';
import formatCoffeeScriptLexerTokens from './utils/formatCoffeeScriptLexerTokens';
import formatDecaffeinateParserAst from './utils/formatDecaffeinateParserAst';
import PatchError from './utils/PatchError';
import removeUnicodeBOMIfNecessary from './utils/removeUnicodeBOMIfNecessary';
import resolveToPatchError from './utils/resolveToPatchError';

export { default as run } from './cli';
import { resolveOptions, Options } from './options';
import notNull from './utils/notNull';
export { PatchError };

export interface ConversionResult {
  code: string;
}

export interface StageResult {
  code: string;
  suggestions: Array<Suggestion>;
}

interface Stage {
  name: string;
  run: (content: string, options: Options) => StageResult;
}

/**
 * Convert CoffeeScript source code into modern JavaScript preserving comments
 * and formatting.
 */
export function convert(source: string, options: Options = {}): ConversionResult {
  source = removeUnicodeBOMIfNecessary(source);
  options = resolveOptions(options);
  const originalNewlineStr = detectNewlineStr(source);
  source = convertNewlines(source, '\n');

  const literate =
    options.literate ||
    notNull(options.filename).endsWith('.litcoffee') ||
    notNull(options.filename).endsWith('.coffee.md');
  let stages = [
    ...(literate ? [LiterateStage] : []),
    NormalizeStage,
    MainStage,
    AddVariableDeclarationsStage,
    SemicolonsStage,
    ResugarStage
  ];
  const runToStage = options.runToStage;
  if (runToStage !== null && runToStage !== undefined) {
    const stageIndex = stages.findIndex(stage => stage.name === runToStage);
    if (stageIndex !== -1) {
      stages = stages.slice(0, stageIndex + 1);
    } else {
      return convertCustomStage(source, runToStage, Boolean(options.useCS2));
    }
  }
  const result = runStages(source, options, stages);
  if (!options.disableSuggestionComment) {
    result.code = prependSuggestionComment(result.code, result.suggestions);
  }
  result.code = convertNewlines(result.code, originalNewlineStr);
  return {
    code: result.code
  };
}

export function modernizeJS(source: string, options: Options = {}): ConversionResult {
  source = removeUnicodeBOMIfNecessary(source);
  options = resolveOptions(options);
  const originalNewlineStr = detectNewlineStr(source);
  source = convertNewlines(source, '\n');
  const stages = [ResugarStage];
  const result = runStages(source, options, stages);
  result.code = convertNewlines(result.code, originalNewlineStr);
  return {
    code: result.code
  };
}

function runStages(initialContent: string, options: Options, stages: Array<Stage>): StageResult {
  let content = initialContent;
  const suggestions: Array<Suggestion> = [];
  stages.forEach(stage => {
    const { code, suggestions: stageSuggestions } = runStage(stage, content, options);
    content = code;
    suggestions.push(...stageSuggestions);
  });
  return { code: content, suggestions: mergeSuggestions(suggestions) };
}

function runStage(stage: Stage, content: string, options: Options): StageResult {
  try {
    return stage.run(content, options);
  } catch (err) {
    const patchError = resolveToPatchError(err, content, stage.name);
    if (patchError !== null) {
      throw patchError;
    }
    throw err;
  }
}

function convertCustomStage(source: string, stageName: string, useCS2: boolean): ConversionResult {
  const context = new CodeContext(source);
  if (stageName === 'coffeescript-lexer') {
    const tokens = useCS2 ? getCoffee2Tokens(source) : getCoffee1Tokens(source);
    return {
      code: formatCoffeeScriptLexerTokens(tokens, context)
    };
  } else if (stageName === 'coffeescript-parser') {
    const nodes = useCS2 ? getCoffee2Nodes(source) : getCoffee1Nodes(source);
    return {
      code: formatCoffeeScriptAst(nodes, context)
    };
  } else if (stageName === 'coffee-lex') {
    return {
      code: formatCoffeeLexTokens(lex(source, { useCS2 }), context)
    };
  } else if (stageName === 'decaffeinate-parser') {
    return {
      code: formatDecaffeinateParserAst(decaffeinateParse(source, { useCS2 }), context)
    };
  } else {
    throw new Error(`Unrecognized stage name: ${stageName}`);
  }
}
