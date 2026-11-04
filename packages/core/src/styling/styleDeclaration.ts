import type { DDUIXNamespacedIdentifier, DDUIXIdentifierMap } from "../identifiers";
import type { DDUIXSource } from "../source";

import type { DDUIXStyleProperty } from "./styleProperty";

export class DDUIXStyleDeclaration {
  constructor(
    public readonly component: DDUIXNamespacedIdentifier,
    public readonly properties: DDUIXIdentifierMap<DDUIXStyleProperty>,
    public source: DDUIXSource,
  ) {}
}
