// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logger(name: string): (...args: Array<any>) => void {
  if (isLoggingEnabled(name)) {
    // eslint-disable-next-line no-console
    return (...args) => console.log(name, ...args);
  } else {
    return () => {};
  }
}

function isLoggingEnabled(name: string): boolean {
  return !!process.env[`DEBUG:${name}`] || !!process.env['DEBUG:*'];
}
