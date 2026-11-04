import type { DDUIXIdentifier } from "./identifiers";
import type { DDUIXSource } from "./source";

export class DDUIXReference {
  constructor(
    public readonly isNegated: boolean,
    public readonly source: DDUIXSource,
  ) {}
}

export class DDUIXDataStoreReference extends DDUIXReference {
  constructor(
    public readonly path: string,
    public readonly isRelative: boolean,
    isNegated: boolean,
    source: DDUIXSource,
  ) {
    super(isNegated, source);
  }

  static negate(reference: DDUIXDataStoreReference) {
    return new DDUIXDataStoreReference(
      reference.path,
      reference.isRelative,
      !reference.isNegated,
      reference.source,
    );
  }

  toJSON() {
    const path = "$." + this.path;

    const pathObject = this.isRelative ? { $relativePath: path } : { $path: path };

    return this.isNegated ? { $not: pathObject } : pathObject;
  }
}

export class DDUIXAttributeValueReference extends DDUIXReference {
  constructor(
    public readonly attribute: DDUIXIdentifier,
    isNegated: boolean,
    source: DDUIXSource,
  ) {
    super(isNegated, source);
  }
}

export class DDUIXDecoratorValueReference extends DDUIXReference {}
