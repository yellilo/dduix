import {
  DDUIXIdentifierSet,
  type DDUIXIdentifier,
  type DDUIXIdentifierMap,
  type DDUIXNamespacedIdentifier,
} from "../identifiers";
import type { DDUIXStyleDeclaration } from "../styling";
import type { DDUIXSource } from "../source";

import { DDUIXDefinition } from "./base";

export class DDUIXStyleDefinition extends DDUIXDefinition {
  constructor(
    public readonly identifier: DDUIXNamespacedIdentifier,
    public readonly base: DDUIXNamespacedIdentifier | undefined,
    public readonly isAbstract: boolean,
    public readonly declarations: DDUIXStyleDeclaration[],
    source: DDUIXSource,
  ) {
    super(identifier, source);
  }

  getDeclaration(component: DDUIXNamespacedIdentifier) {
    return this.declarations.find(d => d.component.toString() === component.toString());
  }

  getDeclarationProperty(component: DDUIXNamespacedIdentifier, property: DDUIXIdentifier) {
    return this.getDeclaration(component)?.properties.get(property);
  }

  toString() {
    let str = "";

    if (this.isAbstract) str += "abstract ";
    str += `style ${this.identifier}`;
    if (this.base) str += ` extends ${this.base}`;

    return str;
  }

  //#region Inheritance

  *getInheritanceIterator(
    styleDefinitions: DDUIXIdentifierMap<DDUIXStyleDefinition>,
    includeSelf = false,
  ) {
    if (includeSelf) yield this;

    let baseIdentifier = this.base;

    while (baseIdentifier) {
      const definition = styleDefinitions.get(baseIdentifier);
      if (!definition) break;

      yield definition;
      baseIdentifier = definition.base;
    }
  }

  getDeclarationIdentifiers(styleDefinitions: DDUIXIdentifierMap<DDUIXStyleDefinition>) {
    const identifiers = new DDUIXIdentifierSet<DDUIXNamespacedIdentifier>();

    for (const definition of this.getInheritanceIterator(styleDefinitions, true)) {
      for (const declaration of definition.declarations) {
        identifiers.add(declaration.component);
      }
    }

    return identifiers;
  }

  getDeclarationPropertyIdentifiers(
    styleDefinitions: DDUIXIdentifierMap<DDUIXStyleDefinition>,
    component: DDUIXNamespacedIdentifier,
  ) {
    const identifiers = new DDUIXIdentifierSet();

    for (const definition of this.getInheritanceIterator(styleDefinitions, true)) {
      const declaration = definition.getDeclaration(component);
      if (!declaration) continue;

      for (const property of declaration.properties) {
        identifiers.add(property.identifier);
      }
    }

    return identifiers;
  }

  //#endregion
}
