import FunctionPatcher from './FunctionPatcher';

export default class ClassBoundMethodFunctionPatcher extends FunctionPatcher {
  expectedArrowType(): string {
    return '=>';
  }

  getBindingStatement(): string {
    let method = this.parent;
    let key = this.context.source.slice(method.key.start, method.key.end);
    return `this.${key} = this.${key}.bind(this)`;
  }
}
