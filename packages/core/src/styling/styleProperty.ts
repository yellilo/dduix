import type { DDUIXColor } from "../color";
import type { DDUIXIdentifier } from "../identifiers";
import type { DDUIXSource } from "../source";
import { DDUIXInteger, type DDUIXValue } from "../value";

export class DDUIXStyleProperty {
  constructor(
    public readonly identifier: DDUIXIdentifier,
    public readonly parameters: DDUIXValue[],
    public source: DDUIXSource,
  ) {}
}

export class DDUIXColorStyleProperty extends DDUIXStyleProperty {
  constructor(
    identifier: DDUIXIdentifier,
    public color: DDUIXColor,
    source: DDUIXSource,
  ) {
    const parameters = [
      new DDUIXInteger(color.red, color.source),
      new DDUIXInteger(color.green, color.source),
      new DDUIXInteger(color.blue, color.source),
    ];

    if (color.alpha !== undefined) {
      parameters.push(new DDUIXInteger(color.alpha, color.source));
    }

    super(identifier, parameters, source);
  }
}
