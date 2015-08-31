/**
 * Gets a free binding suitable for a temporary variable.
 *
 * Note that this does *not* prevent using the same binding again, so users of
 * this should call `scope.assigns` or `scope.declares` with the result of this
 * function if they wish to prevent usage of the free binding identified.
 *
 * @param {Scope} scope
 * @param {string=} base
 * @returns {string}
 */
export default function getFreeBinding(scope, base='ref') {
  let binding = base;

  if (scope.getBinding(binding)) {
    let counter = 1;
    while (scope.getBinding(binding = `${base}${counter}`)) {
      counter++;
    }
  }

  return binding;
}

const LOOP_BINDINGS = ['i', 'j', 'k'];

/**
 * Gets a free binding for the purpose of a loop counter.
 *
 * @param {Scope} scope
 * @returns {string}
 */
export function getFreeLoopBinding(scope) {
  for (let binding of LOOP_BINDINGS) {
    if (!scope.getBinding(binding)) {
      return binding;
    }
  }

  return getFreeBinding(scope, LOOP_BINDINGS[0]);
}
