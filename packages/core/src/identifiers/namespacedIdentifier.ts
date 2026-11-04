import { DDUIXPunctuation } from "../punctuation";
import type { DDUIXSource } from "../source";
import { DDUIXIdentifier } from "./identifier";

export class DDUIXNamespacedIdentifier extends DDUIXIdentifier {
  constructor(
    public namespace: string,
    name: string,
    source: DDUIXSource,
  ) {
    super(name, source);
  }

  toString() {
    return this.namespace + DDUIXPunctuation.NamespaceSeparator + this.name;
  }
}
