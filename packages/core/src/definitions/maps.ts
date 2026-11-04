import { DDUIXIdentifierMap } from "../identifiers";

import type { DDUIXComponentDefinition } from "./component";
import type { DDUIXDecoratorDefinition } from "./decorator";
import type { DDUIXRootDefinition } from "./root";
import type { DDUIXStyleDefinition } from "./style";

export class DDUIXDefinitionMaps {
  readonly components = new DDUIXIdentifierMap<DDUIXComponentDefinition>();
  readonly decorators = new DDUIXIdentifierMap<DDUIXDecoratorDefinition>();
  readonly roots = new DDUIXIdentifierMap<DDUIXRootDefinition>();
  readonly styles = new DDUIXIdentifierMap<DDUIXStyleDefinition>();
}
