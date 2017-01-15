import { SourceType } from 'coffee-lex';

import NodePatcher from './../../../patchers/NodePatcher';
import AssignOpPatcher from './AssignOpPatcher';

import type { PatcherContext } from './../../../patchers/types';

export default class ClassPatcher extends NodePatcher {
  nameAssignee: ?NodePatcher;
  superclass: ?NodePatcher;
  body: ?BlockPatcher;

  constructor(patcherContext: PatcherContext, nameAssignee: ?NodePatcher, parent: ?NodePatcher, body: ?BlockPatcher) {
    super(patcherContext);
    this.nameAssignee = nameAssignee;
    this.superclass = parent;
    this.body = body;
  }

  /**
   * Handle code within class bodies by restructuring the class to use a static
   * method instead.
   *
   * Current limitations:
   * - Doesn't handle anonymous classes.
   * - Doesn't handle classes used in an expression context.
   * - Doesn't deconflict the "initClass" name of the static method.
   * - Doesn't deconflict the variable assignments that are moved outside the
   *   class body.
   * - Technically this changes the execution order of the class body, although
   *   it does so in a way that is unlikely to cause problems in reasonable
   *   code.
   */
  patchAsStatement() {
    if (this.nameAssignee) {
      this.nameAssignee.patch();
    }
    if (this.superclass) {
      this.superclass.patch();
    }
    if (this.body) {
      this.body.patch();
    }

    this.removeThenTokenIfNecessary();

    if (!this.body) {
      return;
    }

    if (this.body.statements.length === 0) {
      return;
    }

    let insertPoint = this.getInitClassInsertPoint();
    let nonMethodPatchers = this.getNonMethodPatchers(insertPoint);

    if (nonMethodPatchers.length > 0) {
      let assignmentNames = this.generateInitClassMethod(nonMethodPatchers, insertPoint);
      let indent = this.getIndent();
      this.insert(this.outerEnd, `\n${indent}${this.nameAssignee.node.data}.initClass()`);
      for (let assignmentName of assignmentNames) {
        this.insert(this.outerStart, `${assignmentName} = undefined\n${indent}`);
      }
    }
  }

  /**
   * For now, code in class bodies is only supported for statement classes.
   */
  patchAsExpression() {
    this.body.patch();
  }

  removeThenTokenIfNecessary() {
    let searchStart;
    if (this.superclass) {
      searchStart = this.superclass.outerEnd;
    } else if (this.nameAssignee) {
      searchStart = this.nameAssignee.outerEnd;
    } else {
      searchStart = this.contentStart;
    }
    let searchEnd;
    if (this.body) {
      searchEnd = this.body.outerStart;
    } else {
      searchEnd = this.contentEnd;
    }
    let index = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      searchStart,
      searchEnd,
      token => token.type === SourceType.THEN
    );
    if (index) {
      this.overwrite(searchStart, searchEnd, `\n${this.getIndent(1)}`);
    }
  }

  getInitClassInsertPoint() {
    if (this.superclass) {
      return this.superclass.outerEnd;
    }
    if (this.nameAssignee) {
      return this.nameAssignee.outerEnd;
    }
    if (this.body) {
      return this.body.outerStart;
    }
    return this.outerStart;
  }

  /**
   * Find the statements in the class body that can't be converted to JS
   * methods. These will later be moved to the top of the class in a static
   * method.
   */
  getNonMethodPatchers(initialDeleteStart) {
    let nonMethodPatchers = [];
    let deleteStart = initialDeleteStart;
    for (let patcher of this.body.statements) {
      if (!this.isClassMethod(patcher)) {
        nonMethodPatchers.push({
          patcher,
          deleteStart,
        });
      }
      deleteStart = patcher.outerEnd;
    }
    return nonMethodPatchers;
  }

  isClassMethod(patcher) {
    if (patcher.node.type === 'Constructor') {
      return true;
    }
    if (this.isClassAssignment(patcher.node)) {
      if (patcher.node.expression.type === 'Function' ||
          patcher.node.expression.type === 'BoundFunction' ||
          patcher.node.expression.type === 'GeneratorFunction' ||
          patcher.node.expression.type === 'BoundGeneratorFunction') {
        return true;
      }
    }
    return false;
  }

  isClassAssignment(node) {
    if (node.type === 'ClassProtoAssignOp') {
      return true;
    }
    if (node.type === 'AssignOp') {
      let {assignee} = node;
      if (assignee.type === 'MemberAccessOp') {
        if (assignee.expression.type === 'This') {
          return true;
        }
        if (this.nameAssignee) {
          let className = this.nameAssignee.node.data;
          if (assignee.expression.type === 'Identifier' &&
              assignee.expression.data === className) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Create the initClass static method by moving nodes from the class body into
   * the static method and indenting them one level.
   *
   * Also return an array of variables that were assigned so that later code can
   * declare them outside the class body to make them accessible within the
   * class.
   */
  generateInitClassMethod(nonMethodPatchers, insertPoint) {
    let bodyIndent = this.body.getIndent();
    // If the body is inline, generate code at one indent level up instead of
    // at the class indentation level.
    if (bodyIndent === this.getIndent()) {
      bodyIndent = this.getIndent(1);
    }
    let indentString = this.getProgramIndentString();
    this.insert(insertPoint, `\n${bodyIndent}@initClass: ->`);
    let assignmentNames = [];
    for (let {patcher, deleteStart} of nonMethodPatchers) {
      let assignmentName = this.getAssignmentName(patcher);
      if (assignmentName) {
        assignmentNames.push(assignmentName);
      }
      let statementCode = this.getNonMethodStatementCode(patcher, deleteStart);
      statementCode = statementCode.replace(/\n/g, `\n${indentString}`);
      this.insert(insertPoint, statementCode);
      this.remove(deleteStart, patcher.outerEnd);
    }
    this.insert(insertPoint, `\n${bodyIndent}${indentString}return`);
    return assignmentNames;
  }

  /**
   * Determine the variable assigned in the given statement, if any, since any
   * assigned variables need to be declared externally so they are available
   * within the class body. Note that this is incomplete at the moment and only
   * covers the common case of a single variable being defined.
   */
  getAssignmentName(statementPatcher) {
    if (statementPatcher.node.type === 'AssignOp' &&
      statementPatcher.node.assignee.type === 'Identifier') {
      return statementPatcher.node.assignee.data;
    }
    if (statementPatcher instanceof ClassPatcher) {
      return statementPatcher.nameAssignee.node.data;
    }
    return null;
  }

  getNonMethodStatementCode(statementPatcher, deleteStart) {
    if (statementPatcher instanceof AssignOpPatcher &&
        this.isClassAssignment(statementPatcher.node)) {
      let {key, expression} = statementPatcher;
      let prefixCode = this.slice(deleteStart, key.outerStart);
      let keyCode = this.slice(key.outerStart, key.outerEnd);
      let suffixCode = this.slice(key.outerEnd, expression.outerEnd);

      let equalIndex = suffixCode.indexOf('=');
      let colonIndex = suffixCode.indexOf(':');
      if (equalIndex === -1 || colonIndex < equalIndex) {
        suffixCode = suffixCode.replace(/:/, ' =');
      }

      if (statementPatcher.node.type === 'ClassProtoAssignOp') {
        // a: b -> @prototype.a = b
        return `${prefixCode}@prototype.${keyCode}${suffixCode}`;
      } else {
        // @a: b -> @a = b
        return `${prefixCode}${keyCode}${suffixCode}`;
      }
    } else if (statementPatcher instanceof ClassPatcher &&
        statementPatcher.nameAssignee) {
      // Nested classes need a special case: they need to be converted to an
      // assignment statement so that the name can be declared outside the outer
      // class body and the initialized within initClass.
      let className = statementPatcher.nameAssignee.node.data;
      let prefix = this.slice(deleteStart, statementPatcher.outerStart);
      let suffix = this.slice(statementPatcher.outerStart, statementPatcher.outerEnd);
      return `${prefix}${className} = ${suffix}`;
    } else {
      return this.slice(deleteStart, statementPatcher.outerEnd);
    }
  }
}
