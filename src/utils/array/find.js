export default Array.prototype.find ?
  (array, iterator, context=undefined) => array.find(iterator, context) :
  (array, iterator, context=undefined) => {
    for (let i = 0; i < array.length; i++) {
      let element = array[i];
      if (iterator.call(context, element, i, array)) {
        return element;
      }
    }
    return undefined;
  };
