/**
 * If the source code starts with a Unicode BOM, CoffeeScript will just ignore
 * it and provide source code locations that assume that it was removed, so we
 * should do the same.
 */
export default function removeUnicodeBOMIfNecessary(source: string): string {
  if (source[0] === '\uFEFF') {
    return source.slice(1);
  } else {
    return source;
  }
}
