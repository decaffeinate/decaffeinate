import { Identifier } from 'decaffeinate-parser';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';

export default class IdentifierPatcher extends PassthroughPatcher {
  node!: Identifier;
}
