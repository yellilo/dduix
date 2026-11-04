import { DDUIXValueType } from "../enums";
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

  satisfiedBy(value: DDUIXFloat | DDUIXInteger) {
    if (!super.satisfiedBy(value)) return false;
    if (this.min !== null && value.value < this.min.value) return false;
    if (this.max !== null && value.value > this.max.value) return false;
    return true;
  }

  subsetOf(constraint: DDUIXConstraint) {
    if (!super.subsetOf(constraint)) return false;

    if (constraint instanceof DDUIXRangeConstraint) {
      return subsetOfRange(
        constraint.min?.value,
        constraint.max?.value,
        this.min?.value,
        this.max?.value,
      );
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
