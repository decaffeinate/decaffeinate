/**
 * Maps a list to another list by combining lists.
 *
 * @param {Array<T>} list
 * @param {function(T): Array<U>} map
 * @returns {Array<U>}
 * @template {T, U}
 */
export default function flatMap(list, map) {
  return list.reduce((memo, item) => memo.concat(map(item)), []);
}
