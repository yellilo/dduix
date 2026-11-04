import type { DDUIXNamespacedIdentifier } from "../identifiers";
import type { DDUIXConstraint } from "../constraints";
import type { DDUIXMarkup } from "../markup";
import type { DDUIXSource } from "../source";

import { DDUIXDefinition } from "./base";

export class DDUIXDecoratorDefinition extends DDUIXDefinition {
  constructor(
    public readonly identifier: DDUIXNamespacedIdentifier,
    public readonly constraint: DDUIXConstraint,
    public readonly markup: DDUIXMarkup,
    source: DDUIXSource,
  ) {
    super(identifier, source);
  }

  toString() {
    return `decorator ${this.identifier} ${this.constraint}`;
  }
}
