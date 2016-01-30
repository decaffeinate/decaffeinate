export default class NodePatcher {
  constructor(node, context, editor) {
    this.node = node;
    this.context = context;
    this.editor = editor;
    this.start = node.range[0];
    this.end = node.range[1];

    this.setStatement(false);
  }

  patch() {
    throw new Error('`patch` must be overridden in subclasses');
  }

  prepend(content) {
    this.insert(this.start, content);
  }

  append(content) {
    this.insert(this.end, content);
  }

  insert(index, content) {
    this.editor.insert(index, content);
  }

  overwrite(start, end, content) {
    this.editor.overwrite(start, end, content);
  }

  remove(start, end) {
    this.editor.remove(start, end);
  }

  context() {
    return this.parent.context();
  }

  initialize() {}

  isStatement() {
    return this._statement;
  }

  setStatement(statement) {
    this._statement = statement;
  }

  returns() {
    return this._returns || false;
  }

  setReturns() {
    this._returns = true;
    if (this.parent) {
      this.parent.setReturns();
    }
  }
}
