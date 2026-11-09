import {
  DDUIXStylePropertyDefinition,
  DDUIXIdentifier,
  DDUIXSource,
  DDUIXValueType,
  DDUIXColorStylePropertyDefinition,
  DDUIXConstraint,
  DDUIXValue,
} from "@dduix/core";

const booleanConstraint = new DDUIXConstraint(DDUIXValueType.Boolean, DDUIXSource.Internal);
const floatConstraint = new DDUIXConstraint(DDUIXValueType.Float, DDUIXSource.Internal);
const stringConstraint = new DDUIXConstraint(DDUIXValueType.String, DDUIXSource.Internal);

export function defineColorStyleProperty(identifier: string, isOptional = true, hasAlpha = true) {
  const definition = new DDUIXColorStylePropertyDefinition(
    new DDUIXIdentifier(identifier, DDUIXSource.Internal),
    isOptional,
    hasAlpha,
  );

  return definition;
}

function paddingToJSON({ top, right, bottom, left }: Record<string, DDUIXValue>) {
  if (top.equals(bottom) && left.equals(right)) {
    return [top, right];
  } else {
    return [top, right, bottom, left];
  }
}

export function definePaddingStyleProperty(identifier: string, isOptional = true) {
  const definition = new DDUIXStylePropertyDefinition(
    new DDUIXIdentifier(identifier, DDUIXSource.Internal),
    floatConstraint,
    ["top", "right", "bottom", "left"],
    isOptional,
    paddingToJSON,
  );

  definition.addWildcard();

  definition.addAlias("x", ["right", "left"]);
  definition.addAlias("y", ["top", "bottom"]);
  definition.addOverload("x", "y");

  return definition;
}

export function defineImagePathStyleProperty(identifier: string, isOptional = true) {
  const definition = new DDUIXStylePropertyDefinition(
    new DDUIXIdentifier(identifier, DDUIXSource.Internal),
    stringConstraint,
    ["path"],
    isOptional,
    ({ path }) => path,
  );

  return definition;
}

export function defineBooleanStyleProperty(
  identifier: string,
  parameterName: string,
  isOptional = true,
) {
  const def = new DDUIXStylePropertyDefinition(
    new DDUIXIdentifier(identifier, DDUIXSource.Internal),
    booleanConstraint,
    [parameterName],
    isOptional,
    parameters => parameters[parameterName],
  );

  return def;
}
