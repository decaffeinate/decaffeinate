/**
 * A code snippet that can be placed at the top of a constructor to allow the
 * constructor to use `this` before `super`, at least when run through Babel or
 * TypeScript.
 *
 * This makes use of two techniques:
 * - Babel does a static analysis check to make sure that all `this` accesses
 *   at least have a chance of happening after the first `super` call. We can
 *   wrap a super call in an `if (false)` at the top to silence this check
 *   without changing the runtime behavior (and later super calls will still
 *   work).
 * - Babel compiles `this` usages in constructors to a separate variable,
 *   usually called `_this`, which gets assigned in the `super` line. However,
 *   the assignment to `_this` only happens when `super` actually runs, so it
 *   will normally be undefined before the `super` call. We can make `_this`
 *   resolve to `this` before the constructor by running `eval('_this = this;')`
 *   to escape Babel's rewriting. However, the variable is not always called
 *   `_this`. We can still get the right variable name, though, but making an
 *   arrow function using `this`, calling `toString`, and parsing the variable
 *   name from it.
 */
export default [
  '{',
  '  // Hack: trick Babel/TypeScript into allowing this before super.',
  '  if (false) { super(); }',
  '  let thisFn = (() => { return this; }).toString();',
  "  let thisName = thisFn.slice(thisFn.indexOf('return') + 6 + 1, thisFn.indexOf(';')).trim();",
  '  eval(`${thisName} = this;`);',
  '}'
];
