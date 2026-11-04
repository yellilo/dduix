import type { DDUIXIdentifier, DDUIXNamespacedIdentifier } from "../identifiers";
import type { DDUIXReference } from "../references";
import type { DDUIXSource } from "../source";
import type { DDUIXValue } from "../value";

export class DDUIXElementAttribute {
  constructor(
    public readonly identifier: DDUIXIdentifier,
    public readonly value: DDUIXValue | DDUIXReference,
    public readonly source: DDUIXSource,
  ) {}
}

export class DDUIXElementDecorator {
  constructor(
    public readonly identifier: DDUIXNamespacedIdentifier,
    public readonly value: DDUIXValue | DDUIXReference,
    public readonly source: DDUIXSource,
  ) {}
}
