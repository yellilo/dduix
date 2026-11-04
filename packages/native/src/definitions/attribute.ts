import {
  DDUIXAttributeDefinition,
  DDUIXConstraint,
  DDUIXIdentifier,
  DDUIXSource,
  type DDUIXValueType,
} from "@dduix/core";

export class DDUIXNativeAttributeDefinition extends DDUIXAttributeDefinition {
  constructor(identifier: DDUIXIdentifier, isOptional: boolean, type: DDUIXValueType) {
    super(
      identifier,
      new DDUIXConstraint(type, DDUIXSource.Internal),
      isOptional,
      null,
      DDUIXSource.Internal,
    );
  }

  /**
   * Converts a DDUIX attribute identifier to its native attribute name equivalent.
   * @returns A native attribute name e.g. "flexGrow"
   */
  public get nativeIdentifier() {
    return this.identifier.name.replace(/_[a-z]/g, upperCaseReplacer);
  }
}

const upperCaseReplacer = (match: string) => match[1].toUpperCase();
