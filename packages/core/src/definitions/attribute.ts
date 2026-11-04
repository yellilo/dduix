import type { DDUIXConstraint } from "../constraints";
import type { DDUIXIdentifier } from "../identifiers";
import { DDUIXPunctuation } from "../punctuation";
import type { DDUIXSource } from "../source";
import type { DDUIXValue } from "../value";

import { DDUIXDefinition } from "./base";

export class DDUIXAttributeDefinition extends DDUIXDefinition {
  constructor(
    identifier: DDUIXIdentifier,
    public readonly constraint: DDUIXConstraint,
    public readonly isNullable: boolean,
    public readonly defaultValue: DDUIXValue | null,
    source: DDUIXSource,
  ) {
    super(identifier, source);
  }

  get isOptional() {
    return this.isNullable || this.defaultValue !== null;
  }

  toString() {
    let content = this.identifier.toString();

    if (this.isNullable) {
      content += DDUIXPunctuation.Question;
    }

    content += " " + this.constraint;

    if (this.defaultValue !== null) {
      content += ` ${DDUIXPunctuation.Assignment} ${this.defaultValue}`;
    }

    return content;
  }
}
