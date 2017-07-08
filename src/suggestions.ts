export type Suggestion = {
  suggestionCode: string,
  message: string,
};

export const REMOVE_BABEL_WORKAROUND = {
  suggestionCode: 'DS001',
  message: 'Remove Babel/TypeScript constructor workaround',
};

export const REMOVE_ARRAY_FROM = {
  suggestionCode: 'DS101',
  message: 'Remove unnecessary use of Array.from',
};

export const CLEAN_UP_IMPLICIT_RETURNS = {
  suggestionCode: 'DS102',
  message: 'Remove unnecessary code created because of implicit returns',
};

export const REMOVE_GUARD = {
  suggestionCode: 'DS103',
  message: 'Rewrite code to no longer use __guard__',
};

export const AVOID_INLINE_ASSIGNMENTS = {
  suggestionCode: 'DS104',
  message: 'Avoid inline assignments',
};

export const SIMPLIFY_COMPLEX_ASSIGNMENTS = {
  suggestionCode: 'DS201',
  message: 'Simplify complex destructure assignments',
};

export const SIMPLIFY_DYNAMIC_RANGE_LOOPS = {
  suggestionCode: 'DS202',
  message: 'Simplify dynamic range loops',
};

export const CLEAN_UP_FOR_OWN_LOOPS = {
  suggestionCode: 'DS203',
  message: 'Remove `|| {}` from converted for-own loops',
};

export const FIX_INCLUDES_EVALUATION_ORDER = {
  suggestionCode: 'DS204',
  message: 'Change includes calls to have a more natural evaluation order',
};

export const AVOID_IIFES = {
  suggestionCode: 'DS205',
  message: 'Consider reworking code to avoid use of IIFEs',
};

export const AVOID_INITCLASS = {
  suggestionCode: 'DS206',
  message: 'Consider reworking classes to avoid initClass',
};

export const SHORTEN_NULL_CHECKS = {
  suggestionCode: 'DS207',
  message: 'Consider shorter variations of null checks',
};

export const AVOID_TOP_LEVEL_THIS = {
  suggestionCode: 'DS208',
  message: 'Avoid top-level this',
};

export const AVOID_TOP_LEVEL_RETURN = {
  suggestionCode: 'DS209',
  message: 'Avoid top-level return',
};

export function mergeSuggestions(suggestions: Array<Suggestion>): Array<Suggestion> {
  let suggestionsByCode = {};
  for (let suggestion of suggestions) {
    suggestionsByCode[suggestion.suggestionCode] = suggestion;
  }
  return Object.keys(suggestionsByCode).sort().map(code => suggestionsByCode[code]);
}

export function prependSuggestionComment(code: string, suggestions: Array<Suggestion>): string {
  if (suggestions.length === 0) {
    return code;
  }
  let commentLines = [
    '/*',
    ' * decaffeinate suggestions:',
    ...suggestions.map(({suggestionCode, message}) => ` * ${suggestionCode}: ${message}`),
    ' * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md',
    ' */'
  ];

  let codeLines = code.split('\n');
  if (codeLines[0].startsWith('#!')) {
    return [
      codeLines[0],
      ...commentLines,
      ...codeLines.slice(1),
    ].join('\n');
  } else {
    return [...commentLines, ...codeLines].join('\n');
  }
}
