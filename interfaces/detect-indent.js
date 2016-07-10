/* @flow */

declare module 'detect-indent' {
  declare function detect(text: string): { type: string, amount: number };

  declare var exports: detect;
}
