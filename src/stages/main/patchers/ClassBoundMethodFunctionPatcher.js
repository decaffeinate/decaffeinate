import FunctionPatcher from './FunctionPatcher';

export default class ClassBoundMethodFunctionPatcher extends FunctionPatcher {
  expectedArrowType(): string {
    return '=>';
  }
}
