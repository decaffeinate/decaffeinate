export default function getCompareOperator(operator: string, negated: boolean): string {
  switch (operator) {
    case '==':
    case 'is':
      return negated ? '!==' : '===';

    case '!=':
    case 'isnt':
      return negated ? '===' : '!==';

    case '<':
      return negated ? '>=' : '<';

    case '>':
      return negated ? '<=' : '>';

    case '<=':
      return negated ? '>' : '<=';

    case '>=':
      return negated ? '<' : '>=';

    default:
      throw new Error(`unsupported equality/inequality type: ${operator}`);
  }
}
