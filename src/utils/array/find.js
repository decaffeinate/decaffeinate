/* @flow */

function nativeFind<T>(array: Array<T>, iterator: (element: T, i: number, array: Array<T>) => boolean, context: any): ?T {
  return array.find(iterator, context);
}

function find<T>(array: Array<T>, iterator: (element: T, i: number, array: Array<T>) => boolean, context: any): ?T {
  for (let i = 0; i < array.length; i++) {
    let element = array[i];
    if (iterator.call(context, element, i, array)) {
      return element;
    }
  }
  return undefined;
}

export default Array.prototype.find ? nativeFind : find;
