/**
 * Gets a free binding suitable for a temporary variable.
 *
 * Note that this does *not* prevent using the same binding again, so users of
 * this should call `scope.assigns` or `scope.declares` with the result of this
 * function if they wish to prevent usage of the free binding identified.
 *
 * @param {Scope} scope
 * @returns {string}
 */
export default function getFreeBinding(scope) {
  let base = 'ref';
  let binding = base;

  if (scope.getBinding(binding)) {
    for (let counter = 1; scope.getBinding(binding = `${base}${counter}`); counter++) {
      // nothing to do
    }
  }

  return binding;
}
