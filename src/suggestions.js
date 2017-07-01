/* @flow */

export type Suggestion = {
  suggestionCode: string,
  message: string,
};

export const REMOVE_BABEL_WORKAROUND = {
  suggestionCode: 'DS001',
  message: 'Remove Babel constructor workaround',
};

export function mergeSuggestions(suggestions: Array<Suggestion>): Array<Suggestion> {
  let suggestionsByCode = {};
  for (let suggestion of suggestions) {
    suggestionsByCode[suggestion.suggestionCode] = suggestion;
  }
  return Object.keys(suggestionsByCode).sort().map(code => suggestionsByCode[code]);
}
