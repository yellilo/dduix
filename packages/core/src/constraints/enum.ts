import { DDUIXValueType } from "../enums";
import { DDUIXTypeError } from "../errors";
import { DDUIXPunctuation } from "../punctuation";
import type { DDUIXSource } from "../source";
import type { DDUIXString } from "../value";

import { DDUIXConstraint } from "./base";

export class DDUIXEnumConstraint extends DDUIXConstraint {
  constructor(
    public values: DDUIXString[],
    source: DDUIXSource,
  ) {
    super(DDUIXValueType.String, source);
  }

  hasValue(value: DDUIXString) {
    return this.values.some(v => v.equals(value));
  }

  satisfiedBy(value: DDUIXString, throwIfFalse = false) {
    if (!super.satisfiedBy(value, throwIfFalse)) return false;

    if (!this.hasValue(value)) {
      if (throwIfFalse) {
        throw new DDUIXTypeError(
          `Value ${value} is not one of the expected strings: ${this.values.join(", ")}`,
          value.source,
        );
      }

      return false;
    }

    return true;
  }

  subsetOf(constraint: DDUIXConstraint, throwIfFalse = false) {
    if (!super.subsetOf(constraint, throwIfFalse)) return false;

    let allValuesInEnum = false;

    if (constraint instanceof DDUIXEnumConstraint) {
      const valueSet = new Set(this.values);

      for (const value of valueSet) {
        if (!constraint.hasValue(value)) continue;
        valueSet.delete(value);
      }

      if (valueSet.size === 0) {
        allValuesInEnum = true;
      }
    }

    if (throwIfFalse && !allValuesInEnum) {
      throw new DDUIXTypeError(
        `Value must be restricted to the following strings: ${this.values.join(", ")}`,
        constraint.source,
      );
    }

    return allValuesInEnum;
  }

  toString() {
    let str = super.toString();

    str += DDUIXPunctuation.ConstraintDomainOpen;
    str += this.values.join(` ${DDUIXPunctuation.EnumSeparator} `);
    str += DDUIXPunctuation.ConstraintDomainClose;

    return str;
  }
}
