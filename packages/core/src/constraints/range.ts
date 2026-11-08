import { DDUIXValueType } from "../enums";
import { DDUIXTypeError } from "../errors";
import { DDUIXPunctuation } from "../punctuation";
import type { DDUIXSource } from "../source";
import type { DDUIXFloat, DDUIXInteger } from "../value";

import { DDUIXConstraint } from "./base";

export class DDUIXRangeConstraint extends DDUIXConstraint {
  constructor(
    public type: DDUIXValueType.Float | DDUIXValueType.Integer,
    public min: DDUIXFloat | DDUIXInteger | null,
    public max: DDUIXFloat | DDUIXInteger | null,
    source: DDUIXSource,
  ) {
    super(type, source);
  }

  satisfiedBy(value: DDUIXFloat | DDUIXInteger, throwIfFalse = false) {
    if (!super.satisfiedBy(value, throwIfFalse)) return false;

    if (this.min !== null && value.value < this.min.value) {
      if (throwIfFalse) {
        throw new DDUIXTypeError(
          `Value must be greater than or equal to minimum value of ${this.min}`,
          value.source,
        );
      }
      return false;
    }

    if (this.max !== null && value.value > this.max.value) {
      if (throwIfFalse) {
        throw new DDUIXTypeError(
          `Value must be less than or equal to maximum value of ${this.max}`,
          value.source,
        );
      }
      return false;
    }

    return true;
  }

  subsetOf(constraint: DDUIXConstraint, throwIfFalse = false) {
    if (!super.subsetOf(constraint, throwIfFalse)) return false;

    if (constraint instanceof DDUIXRangeConstraint) {
      const isSubset = subsetOfRange(
        constraint.min?.value,
        constraint.max?.value,
        this.min?.value,
        this.max?.value,
      );

      if (!isSubset && throwIfFalse) {
        throw new DDUIXTypeError(
          `There is insufficient overlap between range [${this.min}, ${this.max}] and the accepted range [${constraint.min}, ${constraint.max}]`,
          this.source,
        );
      }

      return isSubset;
    }

    return true;
  }

  toString() {
    let str = super.toString();

    str += DDUIXPunctuation.ConstraintDomainOpen;
    str += this.min ?? "";
    str += DDUIXPunctuation.RangeSeparator;
    str += this.max ?? "";
    str += DDUIXPunctuation.ConstraintDomainClose;

    return str;
  }
}

function subsetOfRange(
  supMin: number | undefined,
  supMax: number | undefined,
  subMin: number | undefined,
  subMax: number | undefined,
) {
  if (supMin !== undefined) {
    if (subMin === undefined) return false;
    if (subMin < supMin) return false;
  }

  if (supMax !== undefined) {
    if (subMax === undefined) return false;
    if (subMax > supMax) return false;
  }

  return true;
}
