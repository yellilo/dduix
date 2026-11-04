import type { DDUIXNamespacedIdentifier } from "../identifiers";
import type { DDUIXStyleDeclaration } from "../styling";
import type { DDUIXSource } from "../source";

import { DDUIXDefinition } from "./base";

export class DDUIXStyleDefinition extends DDUIXDefinition {
  constructor(
    public readonly identifier: DDUIXNamespacedIdentifier,
    public readonly base: DDUIXNamespacedIdentifier | undefined,
    public readonly isAbstract: boolean,
    public readonly declarations: DDUIXStyleDeclaration[],
    source: DDUIXSource,
  ) {
    super(identifier, source);
  }

  toString() {
    let str = "";

    if (this.isAbstract) str += "abstract ";
    str += `style ${this.identifier}`;
    if (this.base) str += ` extends ${this.base}`;

    return str;
  }
}
