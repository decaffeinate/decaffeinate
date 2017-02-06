import SharedProgramPatcher from '../../../patchers/SharedProgramPatcher';

export default class ProgramPatcher extends SharedProgramPatcher {
  patchAsStatement() {
    if (this.body) {
      this.body.patch();
    }
    this.patchHelpers();
  }
}
