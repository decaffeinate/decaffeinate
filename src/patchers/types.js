import type Scope from '../utils/Scope';
import type Options from '../index';

export type Range = [number, number];

export type Node = {
  type: string,
  range: Range,
  scope: Scope,
  raw: string,
  line: number,
  column: number,
};

export type ParseContext = {
  source: string,
};

export type Editor = {
  appendLeft: (index: number, content: string) => Editor;
  appendRight: (index: number, content: string) => Editor;
  overwrite: (start: number, end: number, content: string) => Editor;
  remove: (start: number, end: number) => Editor;
  slice: (start: number, end: number) => string;
  append: (content: string) => Editor;
  move: (start: number, end: number, index: number) => Editor;
};

export type PatcherContext = {
  node: Node;
  context: ParseContext;
  editor: Editor;
  options: Options;
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
