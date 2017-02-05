// tslint:disable-next-line:no-any
export function logger(name: string): (...args: Array<any>) => void {
  if (isLoggingEnabled(name)) {
    return (...args) => console.log(name, ...args);
  } else {
    return () => {};
  }
}

function isLoggingEnabled(name: string): boolean {
  return !!process.env[`DEBUG:${name}`] || !!process.env['DEBUG:*'];
}
