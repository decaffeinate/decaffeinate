import { Quasi } from 'decaffeinate-parser';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';

export default class QuasiPatcher extends PassthroughPatcher {
  node!: Quasi;
}
