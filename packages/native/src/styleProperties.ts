import {
  DDUIXStylePropertyDefinition,
  DDUIXIdentifier,
  DDUIXSource,
  DDUIXValueType,
  DDUIXColorStylePropertyDefinition,
  DDUIXConstraint,
} from "@dduix/core";

const booleanConstraint = new DDUIXConstraint(DDUIXValueType.Boolean, DDUIXSource.Internal);
const floatConstraint = new DDUIXConstraint(DDUIXValueType.Float, DDUIXSource.Internal);
const stringConstraint = new DDUIXConstraint(DDUIXValueType.String, DDUIXSource.Internal);

export function defineColorProperty(identifier: string, isOptional = true, hasAlpha = true) {
  const definition = new DDUIXColorStylePropertyDefinition(
    new DDUIXIdentifier(identifier, DDUIXSource.Internal),
    isOptional,
    hasAlpha,
  );

  return definition;
}

export function definePaddingProperty(identifier: string, isOptional = true) {
  const definition = new DDUIXStylePropertyDefinition(
    new DDUIXIdentifier(identifier, DDUIXSource.Internal),
    floatConstraint,
    ["top", "right", "bottom", "left"],
    isOptional,
  );

  definition.acceptsUniform = true;

  definition.addAlias("x", ["right", "left"]);
  definition.addAlias("y", ["top", "bottom"]);
  definition.addOverload("x", "y");

  return definition;
}

export function defineImagePathProperty(identifier: string, isOptional = true) {
  const definition = new DDUIXStylePropertyDefinition(
    new DDUIXIdentifier(identifier, DDUIXSource.Internal),
    stringConstraint,
    ["path"],
    isOptional,
  );

  return definition;
}

export function defineEnabledProperty(identifier: string, isOptional = true) {
  const def = new DDUIXStylePropertyDefinition(
    new DDUIXIdentifier(identifier, DDUIXSource.Internal),
    booleanConstraint,
    ["enabled"],
    isOptional,
  );

  return def;
}
