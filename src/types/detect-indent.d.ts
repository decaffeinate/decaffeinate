declare module 'detect-indent' {
  interface Indent {
    /**
    The type of indentation.
    It is `undefined` if no indentation is detected.
    */
    type: 'tab' | 'space' | undefined;

    /**
    The amount of indentation. For example, `2`.
    */
    amount: number;

    /**
    The actual indentation.
    */
    indent: string;
  }

  function detectIndent(source: string): Indent;

  export = detectIndent;
}
