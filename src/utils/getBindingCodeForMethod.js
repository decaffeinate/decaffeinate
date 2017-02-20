import IdentifierPatcher from '../stages/main/patchers/IdentifierPatcher';
import type ClassAssignOpPatcher from '../stages/main/patchers/ClassAssignOpPatcher';

export default function getBindingCodeForMethod(method: ClassAssignOpPatcher): string {
  let accessCode;
  if (method.key instanceof IdentifierPatcher) {
    accessCode = `.${method.key.node.data}`;
  } else {
    accessCode = `[${method.key.getRepeatCode()}]`;
  }
  return `this${accessCode} = this${accessCode}.bind(this)`;
}
