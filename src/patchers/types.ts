import { Node } from 'decaffeinate-parser/dist/nodes';
import MagicString from 'magic-string';
import { Options } from '../options';
import { Suggestion } from '../suggestions';
import DecaffeinateContext from '../utils/DecaffeinateContext';

export type PatcherContext = {
  node: Node;
  context: DecaffeinateContext;
  editor: MagicString;
  options: Options;
  addSuggestion: (suggestion: Suggestion) => void;
};

export type RepeatableOptions = {
  parens?: boolean,
  ref?: string,
  isForAssignment?: boolean,
  forceRepeat?: boolean,
};

export type PatchOptions = {
  needsParens?: boolean,
  fnNeedsParens?: boolean,
  skipParens?: boolean,
  leftBrace?: boolean,
  rightBrace?: boolean,
};
