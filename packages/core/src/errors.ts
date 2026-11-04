import type { DDUIXSource } from "./source";

export class DDUIXError extends Error {
  constructor(
    message: string,
    public source: DDUIXSource,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class DDUIXCycleError extends DDUIXError {}
export class DDUIXDuplicateIdentifierError extends DDUIXError {}
export class DDUIXIncompatibleDecoratorError extends DDUIXError {}
export class DDUIXMissingAttributeError extends DDUIXError {}
export class DDUIXMissingStylePropertyError extends DDUIXError {}
export class DDUIXReferenceError extends DDUIXError {}
export class DDUIXReservedNamespaceError extends DDUIXError {}
export class DDUIXSyntaxError extends DDUIXError {}
export class DDUIXTypeError extends DDUIXError {}
export class DDUIXUnknownAttributeError extends DDUIXError {}
export class DDUIXUnknownStylePropertyError extends DDUIXError {}
export class DDUIXUnsupportedStylingError extends DDUIXError {}
