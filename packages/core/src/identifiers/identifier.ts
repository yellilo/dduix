import type { DDUIXSource } from "../source";

export class DDUIXIdentifier {
  constructor(
    public name: string,
    public source: DDUIXSource,
  ) {}

  toString() {
    return this.name;
  }
}
