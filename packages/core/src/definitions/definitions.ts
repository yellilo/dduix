import { DDUIXDuplicateIdentifierError } from "../errors";
import { DDUIXIdentifierMap } from "../identifiers";

import type { DDUIXDefinition } from "./base";
import { DDUIXComponentDefinition } from "./component";
import { DDUIXDecoratorDefinition } from "./decorator";
import { DDUIXRootDefinition } from "./root";
import { DDUIXStyleDefinition } from "./style";

import { DDUIXDefinitionFile } from "./file";
import { DDUIXDefinitionMaps } from "./maps";

const mapNames = ["components", "decorators", "roots", "styles"] as const;
type MapName = (typeof mapNames)[number];

export class DDUIXDefinitions extends DDUIXDefinitionMaps {
  readonly #files: Map<string, DDUIXDefinitionFile> = new Map();

  public add(definition: DDUIXDefinition) {
    let mapName: MapName;

    const filePath = definition.source.file;
    let file: DDUIXDefinitionFile | undefined;

    if (filePath) {
      file = this.#files.get(filePath);

      if (!file) {
        file = new DDUIXDefinitionFile(filePath);
        this.#files.set(filePath, file);
      }
    }

    if (definition instanceof DDUIXComponentDefinition) mapName = "components";
    else if (definition instanceof DDUIXDecoratorDefinition) mapName = "decorators";
    else if (definition instanceof DDUIXRootDefinition) mapName = "roots";
    else if (definition instanceof DDUIXStyleDefinition) mapName = "styles";
    else throw new TypeError("Attempted to register an invalid definition.");

    const map: DDUIXIdentifierMap<DDUIXDefinition> = this[mapName];
    const fileMap: DDUIXIdentifierMap<DDUIXDefinition> | undefined = file?.[mapName];

    if (map.has(definition)) {
      throw new DDUIXDuplicateIdentifierError(
        `A definition with the identifier "${definition.identifier}" already exists.`,
        definition.identifier.source,
      );
    }

    map.add(definition);
    fileMap?.add(definition);
  }

  public getFile(file: string) {
    return this.#files.get(file);
  }

  public removeFile(file: string) {
    const definitionFile = this.getFile(file);
    if (!definitionFile) return false;

    for (const mapName of mapNames) {
      const globalMap: DDUIXIdentifierMap<DDUIXDefinition> = this[mapName];

      for (const definition of definitionFile[mapName]) {
        globalMap.remove(definition);
      }
    }

    return this.#files.delete(file);
  }
}
