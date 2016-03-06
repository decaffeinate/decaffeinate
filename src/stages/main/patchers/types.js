import type Scope from '../../../utils/Scope.js';

export type Node = {
  type: string,
  range: Range,
  scope: Scope
};

export type Token = {
  type: string,
  data: string,
  range: Range
};

export type Range = [number, number];

export type ParseContext = {
  source: string,
  tokenAtIndex: (index: number) => ?Token,
  indexOfTokenAtOffset: (offset: number) => ?number,
  tokensForNode: (node: Node) => Array<Token>,
  tokensBetweenNodes: (left: Node, right: Node) => Array<Token>,
  indexOfEndTokenForStartTokenAtIndex: (startTokenIndex: number) => ?number
};

export type Editor = {
  insert: (start: number, end: number, content: string) => void,
  overwrite: (start: number, end: number, content: string) => void,
  remove: (start: number, end: number) => void,
  slice: (start: number, end: number) => string,
  append: (content: string) => void,
};

export type SourceType = {
  name: string
};

export type SourceToken = {
  type: SourceType,
  start: number,
  end: number
}

export type SourceTokenListIndex = {
  next: () => ?SourceTokenListIndex,
  previous: () => ?SourceTokenListIndex,
  advance: (offset: number) => ?SourceTokenListIndex
};

export type SourceTokenList = {
  slice: (start: SourceTokenListIndex, end: SourceTokenListIndex) => SourceTokenList,
  indexOfTokenContainingSourceIndex: (index: number) => ?SourceTokenListIndex,
  indexOfTokenEndingAtSourceIndex: (index: number) => ?SourceTokenListIndex,
  indexOfTokenMatchingPredicate: (predicate: (token: SourceToken) => boolean) => ?SourceTokenListIndex,
  indexOfTokenStartingAtSourceIndex: (index: number) => ?SourceTokenListIndex,
  lastIndexOfTokenMatchingPredicate: (predicate: (token: SourceToken) => boolean) => ?SourceTokenListIndex,
  tokenAtIndex: (index: SourceTokenListIndex) => ?SourceToken
};
