import detectNewlineStr from '../../src/utils/detectNewlineStr';
import { strictEqual } from 'assert';

describe('detectNewlineStr', () => {
  it('detects LF on a string without newlines', () => {
    strictEqual(detectNewlineStr('abc'), '\n');
  });

  it('detects LF when it is more common', () => {
    strictEqual(detectNewlineStr('a\nb\nc\r\nd'), '\n');
  });

  it('detects LF when there is a tie', () => {
    strictEqual(detectNewlineStr('a\nb\r\nc'), '\n');
  });

  it('detects CRLF when it is more common', () => {
    strictEqual(detectNewlineStr('a\r\nb\nc\r\nd'), '\r\n');
  });
});
