export type Options = {
  filename?: string,
  useCS2?: boolean,
  runToStage?: string | null,
  literate?: boolean,
  disableSuggestionComment?: boolean,
  useOptionalChaining?: boolean,
  noArrayIncludes?: boolean,
  useJSModules?: boolean,
  looseJSModules?: boolean,
  safeImportFunctionIdentifiers?: Array<string>,
  preferLet?: boolean,
  loose?: boolean,
  looseDefaultParams?: boolean,
  looseForExpressions?: boolean,
  looseForOf?: boolean,
  looseIncludes?: boolean,
  looseComparisonNegation?: boolean,
  disableBabelConstructorWorkaround?: boolean,
  disallowInvalidConstructors?: boolean,
};

export const DEFAULT_OPTIONS: Options = {
  filename: 'input.coffee',
  useCS2: false,
  runToStage: null,
  literate: false,
  disableSuggestionComment: false,
  useOptionalChaining: false,
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
  disableBabelConstructorWorkaround: false,
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
  return {...DEFAULT_OPTIONS, ...options};
}
