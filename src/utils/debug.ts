export function logger<A extends Array<unknown>>(name: string): (...args: A) => void {
  if (isLoggingEnabled(name)) {
    return (...args) => console.log(name, ...args);
  } else {
    return () => {};
  }
}

function isLoggingEnabled(name: string): boolean {
  return !!process.env[`DEBUG:${name}`] || !!process.env['DEBUG:*'];
}
