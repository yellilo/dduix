import type { DDUIXIdentifier } from "../identifiers";
import type { DDUIXSource } from "../source";

export abstract class DDUIXDefinition {
  constructor(
    public readonly identifier: DDUIXIdentifier,
    public readonly source: DDUIXSource,
  ) {}
}
