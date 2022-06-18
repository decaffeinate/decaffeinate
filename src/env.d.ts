// Only `var` creates own properties on the global object.
/* eslint-disable no-var */

// Ensure this file is treated as a module.
export {};

declare global {
  /**
   * Package name of the project, i.e. "decaffeinate".
   *
   * @see {@link ../tsup.config.ts}
   */
  var __PACKAGE__: string;

  /**
   * Version of the project, i.e. whatever the version is at build time.
   *
   * @see {@link ../tsup.config.ts}
   */
  var __VERSION__: string;
}
