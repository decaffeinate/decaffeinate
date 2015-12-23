export default function wantsToBeStatement(node) {
  switch (node.type) {
    case 'Throw':
      return true;

    case 'Conditional':
      return wantsToBeStatement(node.consequent) || wantsToBeStatement(node.alternate);

    default:
      return false;
  }
}
