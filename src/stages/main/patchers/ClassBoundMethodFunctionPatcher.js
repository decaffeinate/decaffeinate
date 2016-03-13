import FunctionPatcher from './FunctionPatcher.js';

export default class ClassBoundMethodFunctionPatcher extends FunctionPatcher {
  expectedArrowType(): string {
    return '=>';
  }

  getBindingStatement(): string {
    let method = this.parent;
    let key = this.context.source.slice(method.key.contentStart, method.key.contentEnd);
    return `this.${key} = this.${key}.bind(this)`;
  }
}
