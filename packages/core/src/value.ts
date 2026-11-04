import type { DDUIXConstraint } from "./constraints";
import { DDUIXValueType } from "./enums";
import { DDUIXKeywords } from "./keywords";
import { DDUIXPunctuation } from "./punctuation";
import type { DDUIXSource } from "./source";

export abstract class DDUIXValue {
  abstract readonly type: DDUIXValueType;

  constructor(
    public readonly value: boolean | number | string,
    public readonly source: DDUIXSource,
  ) {}

  satisfies(constraint: DDUIXConstraint, throwIfFalse = false) {
    return constraint.satisfiedBy(this, throwIfFalse);
  }

  equals(value: DDUIXValue) {
    return this.type === value.type && this.value === value.value;
  }

  toJSON() {
    return this.value;
  }
}

export class DDUIXBoolean extends DDUIXValue {
  readonly type = DDUIXValueType.Boolean;

  constructor(
    public readonly value: boolean,
    source: DDUIXSource,
  ) {
    super(value, source);
  }

  static negate(value: DDUIXValue) {
    return new DDUIXBoolean(!value.value, value.source);
  }

  toString() {
    return DDUIXKeywords.Boolean.getKeyword(this.value)!;
  }
}

export class DDUIXFloat extends DDUIXValue {
  readonly type = DDUIXValueType.Float;

  constructor(
    public readonly value: number,
    source: DDUIXSource,
  ) {
    super(value, source);
  }

  toString() {
    return this.value.toString();
  }
}

export class DDUIXInteger extends DDUIXValue {
  readonly type = DDUIXValueType.Integer;

  constructor(
    public readonly value: number,
    source: DDUIXSource,
  ) {
    if (!Number.isInteger(value)) {
      throw new TypeError("Value must be an integer");
    }

    super(value, source);
  }

  toString() {
    return this.value.toString();
  }
}

export class DDUIXString extends DDUIXValue {
  readonly type = DDUIXValueType.String;

  constructor(
    public readonly value: string,
    source: DDUIXSource,
  ) {
    super(value, source);
  }

  static escape(value: string, ...escapeChars: string[]) {
    const escapedCharSet = new Set([...defaultEscapeChars, ...escapeChars]);

    let escaped = "";

    for (const char of value) {
      escaped += escapedCharSet.has(char) ? escapeChar(char) : char;
    }

    return escaped;
  }

  toString(quoteChar: string = DDUIXPunctuation.DoubleQuote) {
    return quoteChar + DDUIXString.escape(this.value, quoteChar) + quoteChar;
  }
}

const defaultEscapeChars = [DDUIXPunctuation.StringEscape, "\n", "\r", "\t"];

function escapeChar(char: string) {
  let escaped: string = DDUIXPunctuation.StringEscape;

  if (char === "\n") escaped += "n";
  else if (char === "\r") escaped += "r";
  else if (char === "\t") escaped += "t";
  else escaped += char;

  return escaped;
}
