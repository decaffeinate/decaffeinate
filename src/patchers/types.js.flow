import type Scope from '../utils/Scope';
import type Options from '../index';
import type { Suggestion } from '../suggestions';

export type Range = [number, number];

export type Node = {
  type: string,
  range: Range,
  scope: Scope,
  raw: string,
  line: number,
  column: number,
};

export type DecaffeinateContext = {
  source: string,
};

export type Editor = {
  prependLeft: (index: number, content: string) => Editor;
  appendLeft: (index: number, content: string) => Editor;
  prependRight: (index: number, content: string) => Editor;
  appendRight: (index: number, content: string) => Editor;
  overwrite: (start: number, end: number, content: string) => Editor;
  remove: (start: number, end: number) => Editor;
  slice: (start: number, end: number) => string;
  append: (content: string) => Editor;
  move: (start: number, end: number, index: number) => Editor;
};

export type PatcherContext = {
  node: Node;
  context: DecaffeinateContext;
  editor: Editor;
  options: Options;
  addSuggestion: (Suggestion) => void;
};

export type RepeatableOptions = {
  parens: ?boolean,
  ref: ?string,
  isForAssignment: ?boolean,
  forceRepeat: ?boolean,
};

export type SourceType = number;

export type SourceToken = {
  type: SourceType,
  start: number,
  end: number,
}

export type SourceTokenListIndex = {
  next: () => ?SourceTokenListIndex,
  previous: () => ?SourceTokenListIndex,
  advance: (offset: number) => ?SourceTokenListIndex,
};

type SourceTokenListIndexRange = [SourceTokenListIndex, SourceTokenListIndex];

export type SourceTokenList = {
  slice: (start: SourceTokenListIndex, end: SourceTokenListIndex) => SourceTokenList,
  indexOfTokenContainingSourceIndex: (index: number) => ?SourceTokenListIndex,
  indexOfTokenNearSourceIndex: (index: number) => SourceTokenListIndex,
  indexOfTokenEndingAtSourceIndex: (index: number) => ?SourceTokenListIndex,
  indexOfTokenMatchingPredicate: (predicate: (token: SourceToken) => boolean, start?: SourceTokenListIndex, end?: SourceTokenListIndex) => ?SourceTokenListIndex,
  indexOfTokenStartingAtSourceIndex: (index: number) => ?SourceTokenListIndex,
  lastIndexOfTokenMatchingPredicate: (predicate: (token: SourceToken) => boolean, start?: SourceTokenListIndex, end?: SourceTokenListIndex) => ?SourceTokenListIndex,
  rangeOfMatchingTokensContainingTokenIndex: (startType: SourceType, endType: SourceType, index: SourceTokenListIndex) => ?SourceTokenListIndexRange,
  tokenAtIndex: (index: SourceTokenListIndex) => ?SourceToken,
};
