import { LinesAndColumns } from 'lines-and-columns';
import PatchError from './PatchError';

interface SyntaxError {
  location: {
    first_line: number;
    first_column: number;
    last_line: number;
    last_column: number;
  };
}

/**
 * If the given exception is an error with code location information, extract
 * its start and end position and return a PatchError to use in its place.
 * Otherwise, return null.
 */
export default function resolveToPatchError<T extends Error>(
  err: T,
  content: string,
  stageName: string,
): PatchError | null {
  const makePatchError = (start: number, end: number, source: string): PatchError =>
    new PatchError(`${stageName} failed to parse: ${err.message}`, source, start, end);

  if ('pos' in err) {
    // Handle JavaScript parse errors.
    let { pos } = err as unknown as { pos: number };
    if (pos === content.length) {
      pos--;
    }
    return makePatchError(pos, pos + 1, content);
  } else if ('syntaxError' in err) {
    // Handle CoffeeScript parse errors.
    const {
      syntaxError: { location },
    } = err as unknown as { syntaxError: SyntaxError };
    const lineMap = new LinesAndColumns(content);
    const firstIndex = lineMap.indexForLocation({ line: location.first_line, column: location.first_column });
    let lastIndex = lineMap.indexForLocation({ line: location.last_line, column: location.last_column });
    if (firstIndex !== null) {
      if (lastIndex === null) {
        lastIndex = firstIndex + 1;
      } else {
        lastIndex++;
      }
      return makePatchError(firstIndex, lastIndex, content);
    }
  }
  return null;
}
