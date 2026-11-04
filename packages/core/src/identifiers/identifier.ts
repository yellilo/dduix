import type { DDUIXSource } from "../source";

export class DDUIXIdentifier {
  constructor(
    public name: string,
    public source: DDUIXSource,
  ) {}

  toString() {
    return this.name;
  }

  // Allows identifiers to be compared using (non-strict) equality operators
  valueOf() {
    return this.toString();
  }
}
