import type {
  DDUIXAttributeDefinition,
  DDUIXComponentDefinition,
  DDUIXIdentifier,
  DDUIXNamespacedIdentifier,
  DDUIXDecoratorDefinition,
  DDUIXRootDefinition,
  DDUIXMarkup,
  DDUIXElement,
  DDUIXElementAttribute,
  DDUIXElementDecorator,
  DDUIXValue,
  DDUIXReference,
  DDUIXValueType,
  DDUIXPlaceholderType,
  DDUIXStyleDefinition,
  DDUIXStyleDeclaration,
  DDUIXStyleProperty,
  DDUIXColor,
  DDUIXConstraint,
} from "@dduix/core";

export enum DDUIXNodeType {
  // Definitions
  AttributeDefinition,
  ComponentDefinition,
  DecoratorDefinition,
  RootDefinition,
  StyleDefinition,
  // Identifiers
  AttributeIdentifier,
  ComponentIdentifier,
  DecoratorIdentifier,
  RootIdentifier,
  RootPointIdentifier,
  StyleIdentifier,
  StylePropertyIdentifier,
  // Markup
  Markup,
  Element,
  ElementStartTag,
  ElementChildren,
  ElementEndTag,
  ElementAttribute,
  ElementDecorator,
  // Other
  Color,
  Constraint,
  Value,
  ValueType,
  PlaceholderType,
  Reference,
  StyleDeclaration,
  StyleProperty,
}

export interface DDUIXNodeTypeDataMap {
  // Definitions
  [DDUIXNodeType.AttributeDefinition]: DDUIXAttributeDefinition;
  [DDUIXNodeType.ComponentDefinition]: DDUIXComponentDefinition;
  [DDUIXNodeType.DecoratorDefinition]: DDUIXDecoratorDefinition;
  [DDUIXNodeType.RootDefinition]: DDUIXRootDefinition;
  [DDUIXNodeType.StyleDefinition]: DDUIXStyleDefinition;
  // Identifiers
  [DDUIXNodeType.AttributeIdentifier]: DDUIXIdentifier;
  [DDUIXNodeType.ComponentIdentifier]: DDUIXNamespacedIdentifier;
  [DDUIXNodeType.DecoratorIdentifier]: DDUIXNamespacedIdentifier;
  [DDUIXNodeType.RootIdentifier]: DDUIXNamespacedIdentifier;
  [DDUIXNodeType.RootPointIdentifier]: DDUIXNamespacedIdentifier;
  [DDUIXNodeType.StyleIdentifier]: DDUIXNamespacedIdentifier;
  [DDUIXNodeType.StylePropertyIdentifier]: DDUIXIdentifier;
  // Markup
  [DDUIXNodeType.Markup]: DDUIXMarkup;
  [DDUIXNodeType.Element]: DDUIXElement;
  [DDUIXNodeType.ElementStartTag]: null;
  [DDUIXNodeType.ElementChildren]: null;
  [DDUIXNodeType.ElementEndTag]: null;
  [DDUIXNodeType.ElementAttribute]: DDUIXElementAttribute;
  [DDUIXNodeType.ElementDecorator]: DDUIXElementDecorator;
  // Other
  [DDUIXNodeType.Color]: DDUIXColor;
  [DDUIXNodeType.Constraint]: DDUIXConstraint;
  [DDUIXNodeType.Value]: DDUIXValue;
  [DDUIXNodeType.ValueType]: DDUIXValueType;
  [DDUIXNodeType.PlaceholderType]: DDUIXPlaceholderType;
  [DDUIXNodeType.Reference]: DDUIXReference;
  [DDUIXNodeType.StyleDeclaration]: DDUIXStyleDeclaration;
  [DDUIXNodeType.StyleProperty]: DDUIXStyleProperty;
}
