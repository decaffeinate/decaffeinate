import type NodePatcher from '../patchers/NodePatcher';

export default class PatchError extends Error {
  constructor(message: string, patcher: NodePatcher, start: number, end: number) {
    super(message);
    this.message = message;
    this.patcher = patcher;
    this.start = start;
    this.end = end;
  }

  toString(): string {
    return this.message;
  }
}
