import FunctionPatcher from './FunctionPatcher.js';

export default class ClassBoundMethodFunctionPatcher extends FunctionPatcher {
  expectedArrowType(): string {
    return '=>';
  }
}
