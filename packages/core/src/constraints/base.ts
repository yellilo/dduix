import { DDUIXValueType } from "../enums";
import { DDUIXTypeError } from "../errors";
import { DDUIXKeywords } from "../keywords";
import type { DDUIXSource } from "../source";
import type { DDUIXValue } from "../value";

function areTypesCompatible(provided: DDUIXValueType, expected: DDUIXValueType) {
  return (
    provided === expected ||
    (provided === DDUIXValueType.Integer && expected === DDUIXValueType.Float)
  );
}

function throwIncompatibleType(
  provided: DDUIXValueType,
  expected: DDUIXValueType,
  source: DDUIXSource,
): never {
  const providedType = DDUIXKeywords.ValueType.getKeyword(provided);
  const expectedType = DDUIXKeywords.ValueType.getKeyword(expected);

  throw new DDUIXTypeError(
    `Value of type ${providedType} is not assignable to type ${expectedType}`,
    source,
  );
}

export class DDUIXConstraint {
  constructor(
    public type: DDUIXValueType,
    public source: DDUIXSource,
  ) {}

  satisfiedBy(value: DDUIXValue, throwIfFalse = false) {
    const satisfied = areTypesCompatible(value.type, this.type);

    if (throwIfFalse && !satisfied) {
      throwIncompatibleType(value.type, this.type, value.source);
    }

    return satisfied;
  }

  subsetOf(constraint: DDUIXConstraint, throwIfFalse = false) {
    const isSubset = areTypesCompatible(this.type, constraint.type);

    if (throwIfFalse && !isSubset) {
      throwIncompatibleType(this.type, constraint.type, this.source);
    }

    return isSubset;
  }

  toString() {
    return DDUIXKeywords.ValueType.getKeyword(this.type)!;
  }
}
