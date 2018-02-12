import stripSharedIndent from './stripSharedIndent';

export default function getInvalidConstructorErrorMessage(firstSentence: string): string {
  return stripSharedIndent(`
    ${firstSentence}
    
    JavaScript requires all subclass constructors to call \`super\` and to do so
    before the first use of \`this\`, so the following cases cannot be converted
    automatically:
    * Constructors in subclasses that use \`this\` before \`super\`.
    * Constructors in subclasses that omit the \`super\` call.
    * Subclasses that use \`=>\` method syntax to automatically bind methods.
    
    To convert these cases to JavaScript anyway, remove the option
    --disallow-invalid-constructors when running decaffeinate.
  `);
}
