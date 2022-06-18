import { Node } from 'decaffeinate-parser';
import MagicString from 'magic-string';
import { Options } from '../options';
import { Suggestion } from '../suggestions';
import DecaffeinateContext from '../utils/DecaffeinateContext';

export interface PatcherContext {
  node: Node;
  context: DecaffeinateContext;
  editor: MagicString;
  options: Options;
  addSuggestion: (suggestion: Suggestion) => void;
}

export interface RepeatableOptions {
  parens?: boolean;
  ref?: string;
  isForAssignment?: boolean;
  forceRepeat?: boolean;
}

export interface PatchOptions {
  needsParens?: boolean;
  fnNeedsParens?: boolean;
  skipParens?: boolean;
  leftBrace?: boolean;
  rightBrace?: boolean;
  method?: boolean;
  forceTemplateLiteral?: boolean;
}
