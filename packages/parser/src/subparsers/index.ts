import type { DDUIXInternalParser } from "../parser";

import { DDUIXInternalDefinitionSubparser } from "./definition";
import { DDUIXInternalIdentifierSubparser } from "./identifier";
import { DDUIXInternalMarkupSubparser } from "./markup";
import { DDUIXInternalStylingSubparser } from "./styling";
import { DDUIXInternalValueSubparser } from "./value";

export class DDUIXInternalSubparsers {
  definition: DDUIXInternalDefinitionSubparser;
  identifier: DDUIXInternalIdentifierSubparser;
  markup: DDUIXInternalMarkupSubparser;
  styling: DDUIXInternalStylingSubparser;
  value: DDUIXInternalValueSubparser;

  constructor(parser: DDUIXInternalParser) {
    this.definition = new DDUIXInternalDefinitionSubparser(parser);
    this.identifier = new DDUIXInternalIdentifierSubparser(parser);
    this.markup = new DDUIXInternalMarkupSubparser(parser);
    this.styling = new DDUIXInternalStylingSubparser(parser);
    this.value = new DDUIXInternalValueSubparser(parser);
  }
}
