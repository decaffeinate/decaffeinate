import { strictEqual } from 'assert';
import convertNewlines from '../../src/utils/convertNewlines';

describe('convertNewlines', () => {
  it('converts mixed newlines to LF', () => {
    strictEqual(convertNewlines('a\r\nb\nc\nd\r\ne', '\n'), 'a\nb\nc\nd\ne');
  });

  it('converts mixed newlines to CRLF', () => {
    strictEqual(convertNewlines('a\r\nb\nc\nd\r\ne', '\r\n'), 'a\r\nb\r\nc\r\nd\r\ne');
  });
});
