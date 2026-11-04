import {
  DDUIXValueType,
  DDUIXIdentifier,
  DDUIXIdentifierMap,
  DDUIXNamespacedIdentifier,
  DDUIXSource,
  DDUIXStylePropertyDefinition,
} from "@dduix/core";
import { DDUIXNativeAttributeDefinition, DDUIXNativeComponentDefinition } from "./definitions";
import { nativeNamespace } from "./namespace";
import { defineColorProperty, defineEnabledProperty } from "./styleProperties";

export const nativeComponentDefinitions = new DDUIXIdentifierMap<DDUIXNativeComponentDefinition>();

//#region Definitions

defineNativeComponent(
  "context",
  true,
  // Attributes
  [["data", false, DDUIXValueType.Object]],
);

defineNativeComponent(
  "context_list",
  true,
  // Attributes
  [["data", false, DDUIXValueType.ObjectArray]],
);

defineNativeComponent(
  "label",
  false,
  // Attributes
  [["text", false, DDUIXValueType.String]],
  [defineColorProperty("color"), defineEnabledProperty("shadow")],
);

defineNativeComponent(
  "visibility",
  true,
  // Attributes
  [["visible", false, DDUIXValueType.Boolean]],
);

//#endregion

//#region Utilities

function defineNativeComponent(
  name: string,
  wantsChildren: boolean,
  attributes: Parameters<typeof defineNativeAttribute>[],
  styleProperties?: DDUIXStylePropertyDefinition[],
) {
  const attributeDefinitions = new DDUIXIdentifierMap(
    attributes.map(args => defineNativeAttribute(...args)),
  );

  const definition = new DDUIXNativeComponentDefinition(
    new DDUIXNamespacedIdentifier(nativeNamespace, name, DDUIXSource.Internal),
    attributeDefinitions,
    new DDUIXIdentifierMap(styleProperties),
    wantsChildren,
  );

  nativeComponentDefinitions.add(definition);
}

function defineNativeAttribute(name: string, isOptional: boolean, type: DDUIXValueType) {
  return new DDUIXNativeAttributeDefinition(
    new DDUIXIdentifier(name, DDUIXSource.Internal),
    isOptional,
    type,
  );
}

//#endregion
