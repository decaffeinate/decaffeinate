import determineIndent from './determineIndent';
import getIndent from './getIndent';

/**
 * Adjust an indent in source at a specific offset by an amount.
 */
export default function adjustIndent(source: string, offset: number, adjustment: number): string {
  let currentIndent = getIndent(source, offset);
  const determinedIndent = determineIndent(source);

  if (adjustment > 0) {
    while (adjustment--) {
      currentIndent += determinedIndent;
    }
  } else if (adjustment < 0) {
    currentIndent = currentIndent.slice(determinedIndent.length * -adjustment);
  }

  return currentIndent;
}
