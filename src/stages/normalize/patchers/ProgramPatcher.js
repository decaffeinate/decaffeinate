import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';

export default class ProgramPatcher extends PassthroughPatcher {
  shouldTrimContentRange() {
    return true;
  }
}
