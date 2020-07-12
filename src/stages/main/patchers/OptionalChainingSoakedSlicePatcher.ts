/**
 * Handles soaked array or string slicing, e.g. `names?[i..]`.
 */
import SlicePatcher from './SlicePatcher';

/**
 * Patches soaked slices while targeting optional chaining. This is
 * _almost_ a straight passthrough, we just keep the `?` in the slice call.
 *
 * @example
 *
 * This:
 *
 * ```coffee
 * a?[b..c]
 * ```
 *
 * converts to this:
 *
 * ```js
 * a?.slice(b, c + 1 || undefined)
 * ```
 */
export default class OptionalChainingSoakedSlicePatcher extends SlicePatcher {
  getSliceStartCode(splice = false): string {
    return splice ? '?.splice(' : '?.slice(';
  }
}
