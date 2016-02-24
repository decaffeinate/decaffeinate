import type Scope from '../utils/Scope.js';

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
