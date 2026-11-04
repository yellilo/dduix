import type { DDUIXNamespacedIdentifier } from "../identifiers";
import type { DDUIXMarkup } from "../markup";
import type { DDUIXSource } from "../source";

import { DDUIXDefinition } from "./base";

export class DDUIXRootDefinition extends DDUIXDefinition {
  constructor(
    public readonly identifier: DDUIXNamespacedIdentifier,
    public readonly rootPoint: DDUIXNamespacedIdentifier,
    public readonly markup: DDUIXMarkup,
    source: DDUIXSource,
  ) {
    super(identifier, source);
  }

  toString() {
    return `root ${this.identifier} at ${this.rootPoint}`;
  }
}
