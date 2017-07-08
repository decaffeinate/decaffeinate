export default function notNull<T>(t: T | null): T {
  if (t === null) {
    throw new Error('Unexpected null value.');
  }
  return t;
}
