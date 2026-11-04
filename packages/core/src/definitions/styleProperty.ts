import { DDUIXConstraint, DDUIXRangeConstraint } from "../constraints";
import { DDUIXPunctuation } from "../punctuation";
import { DDUIXIdentifier } from "../identifiers";
import { DDUIXInteger } from "../value";
import { DDUIXSource } from "../source";

import { DDUIXDefinition } from "./base";
import { DDUIXValueType } from "../enums";

export class DDUIXStylePropertyDefinition extends DDUIXDefinition {
  acceptsUniform = false;
  overloads: DDUIXStylePropertyOverload[] = [];

  #aliases = new Map<string, string[]>();

  constructor(
    identifier: DDUIXIdentifier,
    public constraint: DDUIXConstraint,
    public parameters: string[],
    public isOptional = true,
  ) {
    super(identifier, DDUIXSource.Internal);
    this.addOverload(...parameters);
  }

  addAlias(name: string, parameters: string[]) {
    this.#aliases.set(name, parameters);
  }

  getAlias(name: string) {
    return this.#aliases.get(name);
  }

  addOverload(...parameters: string[]) {
    this.overloads.push(new DDUIXStylePropertyOverload(parameters));
    this.overloads.sort((a, b) => a.parameters.length - b.parameters.length);
  }

  getOverload(parameterCount: number) {
    return this.overloads.find(o => o.parameters.length === parameterCount);
  }

  toString() {
    let str = `(style property) ${this.identifier} ${this.constraint} ${DDUIXPunctuation.Assignment} `;

    let overloadCount = this.overloads.length;

    const isColorProperty = this instanceof DDUIXColorStylePropertyDefinition;
    if (isColorProperty) overloadCount++;
    if (this.acceptsUniform) overloadCount++;

    if (isColorProperty) {
      str += `#<hex>`;
    } else if (this.acceptsUniform) {
      str += `<*>`;
    } else {
      str += this.overloads[0];
    }

    str += DDUIXPunctuation.StylePropertyDelimeter;

    overloadCount--;
    if (overloadCount) {
      str += `\n(+${overloadCount} overloads)`;
    }

    return str;
  }
}

const rgbParameters = ["red", "green", "blue"];

const channelConstraint = new DDUIXRangeConstraint(
  DDUIXValueType.Integer,
  new DDUIXInteger(0, DDUIXSource.Internal),
  new DDUIXInteger(255, DDUIXSource.Internal),
  DDUIXSource.Internal,
);

export class DDUIXColorStylePropertyDefinition extends DDUIXStylePropertyDefinition {
  constructor(
    identifier: DDUIXIdentifier,
    isOptional: boolean,
    public hasAlpha = true,
  ) {
    const parameters = [...rgbParameters];

    if (hasAlpha) {
      parameters.push("alpha");
    }

    super(identifier, channelConstraint, parameters, isOptional);

    if (hasAlpha) this.addOverload(...rgbParameters);
  }
}

export class DDUIXStylePropertyOverload {
  constructor(public parameters: string[]) {}

  toString() {
    return this.parameters.map(name => `<${name}>`).join(" ");
  }
}
