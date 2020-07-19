export function toUnix(s: string): string {
  const double = /\\/;
  while (s.match(double)) {
    s = s.replace(double, '/');
  }
  return s;
}
