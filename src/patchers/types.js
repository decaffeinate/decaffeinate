import type Scope from '../utils/Scope.js';

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
  insert: (start: number, end: number, content: string) => void,
  overwrite: (start: number, end: number, content: string) => void,
  remove: (start: number, end: number) => void,
  slice: (start: number, end: number) => string,
  append: (content: string) => void,
};

export type SourceType = {
  name: string,
};

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
  indexOfTokenEndingAtSourceIndex: (index: number) => ?SourceTokenListIndex,
  indexOfTokenMatchingPredicate: (predicate: (token: SourceToken) => boolean, start?: SourceTokenListIndex) => ?SourceTokenListIndex,
  indexOfTokenStartingAtSourceIndex: (index: number) => ?SourceTokenListIndex,
  lastIndexOfTokenMatchingPredicate: (predicate: (token: SourceToken) => boolean, start?: SourceTokenListIndex) => ?SourceTokenListIndex,
  rangeOfMatchingTokensContainingTokenIndex: (startType: SourceType, endType: SourceType, index: SourceTokenListIndex) => ?SourceTokenListIndexRange,
  tokenAtIndex: (index: SourceTokenListIndex) => ?SourceToken,
};
