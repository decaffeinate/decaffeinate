import NodePatcher from '../patchers/NodePatcher';

const MOD_HELPER =
  `function __mod__(a, b) {
  a = +a;
  b = +b;
  return (a % b + b) % b;
}`;

export default function registerModHelper(patcher: NodePatcher): string {
  return patcher.registerHelper('__mod__', MOD_HELPER);
}
