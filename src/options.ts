export interface Options {
  filename?: string;
  useCS2?: boolean;
  runToStage?: string | null;
  literate?: boolean;
  disableSuggestionComment?: boolean;
  noArrayIncludes?: boolean;
  useJSModules?: boolean;
  looseJSModules?: boolean;
  safeImportFunctionIdentifiers?: Array<string>;
  preferLet?: boolean;
  loose?: boolean;
  looseDefaultParams?: boolean;
  looseForExpressions?: boolean;
  looseForOf?: boolean;
  looseIncludes?: boolean;
  looseComparisonNegation?: boolean;
  disallowInvalidConstructors?: boolean;
  optionalChaining?: boolean;
}

export const DEFAULT_OPTIONS: Options = {
  filename: 'input.coffee',
  useCS2: false,
  runToStage: null,
  literate: false,
  disableSuggestionComment: false,
  noArrayIncludes: false,
  useJSModules: false,
  looseJSModules: false,
  safeImportFunctionIdentifiers: [],
  preferLet: false,
  loose: false,
  looseDefaultParams: false,
  looseForExpressions: false,
  looseForOf: false,
  looseIncludes: false,
  looseComparisonNegation: false,
  disallowInvalidConstructors: false,
};

export function resolveOptions(options: Options): Options {
  if (options.loose) {
    options = {
      ...options,
      looseDefaultParams: true,
      looseForExpressions: true,
      looseForOf: true,
      looseIncludes: true,
      looseComparisonNegation: true,
      looseJSModules: true,
    };
  }
  if (options.runToStage === 'EsnextStage') {
    options = { ...options, runToStage: 'ResugarStage' };
  }
  return { ...DEFAULT_OPTIONS, ...options };
}
