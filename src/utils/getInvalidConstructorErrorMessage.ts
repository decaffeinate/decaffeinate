import stripSharedIndent from "./stripSharedIndent";

export default function getInvalidConstructorErrorMessage(firstSentence: string): string {
  return stripSharedIndent(`
    ${firstSentence}
    
    JavaScript requires all subclass constructors to call \`super\` and to do so
    before the first use of \`this\`, so the following cases cannot be converted
    automatically:
    * Constructors in subclasses that use \`this\` before \`super\`.
    * Constructors in subclasses that omit the \`super\` call.
    * Subclasses that use \`=>\` method syntax to automatically bind methods.
    
    To convert these cases to JavaScript anyway, run decaffeinate with
    --allow-invalid-constructors. You will then need to fix these cases after the
    conversion to JavaScript. Alternatively, you may want to first edit your
    CoffeeScript code to avoid the above cases, so that decaffeinate can run without
    this error message.
    
    If you are using Babel or TypeScript, you can run decaffeinate with
    --enable-babel-constructor-workaround to generate Babel-specific code to allow
    constructors that don't call \`super\`. Note that this approach is fragile and
    may break in future versions of Babel/TypeScript.
  `);
}
