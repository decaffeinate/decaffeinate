import NodePatcher from '../../../patchers/NodePatcher';

export default class AssignOpPatcher extends NodePatcher {
  assignee: NodePatcher;
  expression: NodePatcher;
}
