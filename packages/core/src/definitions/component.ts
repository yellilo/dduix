import type { DDUIXIdentifierMap, DDUIXNamespacedIdentifier } from "../identifiers";
import type { DDUIXMarkup } from "../markup";
import { DDUIXPunctuation } from "../punctuation";
import type { DDUIXSource } from "../source";

import type { DDUIXAttributeDefinition } from "./attribute";
import { DDUIXDefinition } from "./base";

export class DDUIXComponentDefinition extends DDUIXDefinition {
  constructor(
    public readonly identifier: DDUIXNamespacedIdentifier,
    public readonly attributes: DDUIXIdentifierMap<DDUIXAttributeDefinition>,
    public readonly markup: DDUIXMarkup,
    source: DDUIXSource,
  ) {
    super(identifier, source);
  }

  toString() {
    let content = `component ${this.identifier} `;

    content += DDUIXPunctuation.AttributeDefinitionsOpen;
    content += this.attributes.values.join(DDUIXPunctuation.Comma + " ");
    content += DDUIXPunctuation.AttributeDefinitionsClose;

    return content;
  }
}
