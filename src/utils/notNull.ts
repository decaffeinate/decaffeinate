export default function notNull<T>(t: T | null | undefined): T {
  if (t === null || t === undefined) {
    throw new Error('Unexpected null value.');
  }
  return t;
}
