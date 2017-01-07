export function nativeFind<T, U>(array: Array<T>, iterator: (element: T, i: number, array: Array<T>) => boolean, context: U): T | undefined {
  return array.find(iterator, context);
}

export function find<T, U>(array: Array<T>, iterator: (element: T, i: number, array: Array<T>) => boolean, context: U): T | undefined {
  for (let i = 0; i < array.length; i++) {
    let element = array[i];
    if (iterator.call(context, element, i, array)) {
      return element;
    }
  }
  return undefined;
}

export default Array.prototype.find ? nativeFind : find;
