import { Quasi } from 'decaffeinate-parser/dist/nodes';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';

export default class QuasiPatcher extends PassthroughPatcher {
  node: Quasi;
}
