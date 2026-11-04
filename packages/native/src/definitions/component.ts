import {
  DDUIXComponentDefinition,
  DDUIXIdentifierMap,
  DDUIXMarkup,
  DDUIXNamespacedIdentifier,
  DDUIXPlaceholderElement,
  DDUIXPlaceholderType,
  DDUIXSource,
  DDUIXStylePropertyDefinition,
} from "@dduix/core";
import type { DDUIXNativeAttributeDefinition } from "./attribute";

const nativeMarkupEmpty = new DDUIXMarkup([], DDUIXSource.Internal);

const nativeMarkup = new DDUIXMarkup(
  [
    new DDUIXPlaceholderElement(
      DDUIXPlaceholderType.ComponentChildren,
      new DDUIXIdentifierMap(),
      new DDUIXIdentifierMap(),
      DDUIXSource.Internal,
    ),
  ],
  DDUIXSource.Internal,
);

export class DDUIXNativeComponentDefinition extends DDUIXComponentDefinition {
  constructor(
    identifier: DDUIXNamespacedIdentifier,
    public attributes: DDUIXIdentifierMap<DDUIXNativeAttributeDefinition>,
    public styleProperties: DDUIXIdentifierMap<DDUIXStylePropertyDefinition>,
    wantsChildren: boolean,
  ) {
    super(
      identifier,
      attributes,
      wantsChildren ? nativeMarkup : nativeMarkupEmpty,
      DDUIXSource.Internal,
    );
  }

  /**
   * Converts a DDUIX component identifier to its native component name equivalent.
   */
  public get nativeIdentifier() {
    return this.identifier.toString();
  }
}
