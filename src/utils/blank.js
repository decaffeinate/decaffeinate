/**
 * Generates a blank object with no prototype.
 */
export default function blank(): Object {
  return Object.create(null);
}
