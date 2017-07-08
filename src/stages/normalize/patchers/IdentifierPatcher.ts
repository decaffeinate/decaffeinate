import { Identifier } from 'decaffeinate-parser/dist/nodes';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';

export default class IdentifierPatcher extends PassthroughPatcher {
  node: Identifier;
}
