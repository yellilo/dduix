import {
  DDUIXCycleError,
  DDUIXDefinitions,
  DDUIXElement,
  DDUIXError,
  DDUIXMarkup,
  DDUIXNamespacedIdentifier,
  DDUIXPlaceholderElement,
  DDUIXPlaceholderType,
  DDUIXSource,
  type DDUIXRootDefinition,
} from "@dduix/core";
import { DDUIXNativeComponentDefinition, nativeComponentDefinitions } from "@dduix/native";

import {
  DDUIXLayoutElement,
  type DDUIXLayoutElementAttribute,
  type DDUIXLayoutElementAttributes,
} from "./layoutElement";
import { DDUIBuilder, type DDUIRoot } from "./ddui";

export class DDUIXCompiler {
  constructor() {}

  #definitions: DDUIXDefinitions = new DDUIXDefinitions();
  /** Maps elements to the element that included it in its markup */
  readonly #owners = new Map<DDUIXElement, DDUIXElement>();
  /** Maps target placeholders to the elements they are targeting */
  readonly #targets = new Map<DDUIXPlaceholderElement, DDUIXElement[]>();

  compiledRoots: DDUIRoot[] = [];

  private getComponentDefinition(identifier: DDUIXNamespacedIdentifier) {
    const componentDefinitions = this.#definitions.components;

    return componentDefinitions.get(identifier) ?? nativeComponentDefinitions.get(identifier);
  }

  public compileRoots(definitions: DDUIXDefinitions) {
    this.#definitions = definitions;
    this.compiledRoots = [];

    for (const definition of definitions.roots) {
      this.compiledRoots.push(this.compileRootDefinition(definition));
    }
  }

  private compileRootDefinition(definition: DDUIXRootDefinition): DDUIRoot {
    const ddui = DDUIBuilder.createRoot(
      definition.identifier,
      definition.rootPoint,
      this.expandElements(definition.markup.body),
    );

    this.#owners.clear();
    this.#targets.clear();

    return ddui;
  }

  //#region Element Expansion

  private expandElements(elements: DDUIXElement[]) {
    const output: DDUIXLayoutElement[] = [];

    for (const element of elements) {
      output.push(...this.expandElement(element));
    }

    return output;
  }

  private expandElement(element: DDUIXElement) {
    if (element.decorators.size > 0) {
      return this.expandElements(this.applyElementDecorators(element));
    }

    if (element instanceof DDUIXPlaceholderElement) {
      return this.expandPlaceholderElement(element);
    }

    return this.expandComponentElement(element);
  }

  private expandComponentElement(element: DDUIXElement): DDUIXLayoutElement[] {
    const componentDefinition = this.getComponentDefinition(element.component)!;

    this.detectComponentCycle(element);

    const markup = componentDefinition.markup.clone();
    this.assignOwnership(markup, element);

    const attributes = element.attributes as DDUIXLayoutElementAttributes;
    const expandedMarkup = this.expandElements(markup.body);

    if (componentDefinition instanceof DDUIXNativeComponentDefinition) {
      const children = markup.body.length === 0 ? undefined : expandedMarkup;

      const layoutElement = new DDUIXLayoutElement(componentDefinition, attributes, children);
      return [layoutElement];
    } else {
      return expandedMarkup;
    }
  }

  private expandPlaceholderElement(element: DDUIXPlaceholderElement): DDUIXLayoutElement[] {
    switch (element.type) {
      case DDUIXPlaceholderType.ComponentChildren:
        return this.expandChildrenPlaceholderElement(element);

      case DDUIXPlaceholderType.DecoratorTarget:
        return this.expandTargetPlaceholderElement(element);

      default:
        throw new DDUIXError("Unknown placeholder type", element.source);
    }
  }

  private expandChildrenPlaceholderElement(element: DDUIXPlaceholderElement): DDUIXLayoutElement[] {
    const owner = this.#owners.get(element);
    if (!owner?.children) return [];

    return this.expandElements(owner.children);
  }

  private expandTargetPlaceholderElement(element: DDUIXPlaceholderElement): DDUIXLayoutElement[] {
    let target = this.#targets.get(element)!;

    if (element.attributes.size > 0) {
      if (target.length !== 1) {
        throw new DDUIXError("Invalid decorator usage", DDUIXSource.Internal);
      }

      const withAttrs = target[0].clone();
      for (const attribute of element.attributes) {
        if (!withAttrs.attributes.has(attribute)) {
          withAttrs.attributes.add(attribute);
        }
      }

      target = [withAttrs];
    }

    return this.expandElements(target);
  }

  //#endregion

  //#region Decorators

  private applyElementDecorators(element: DDUIXElement) {
    const initialCopy = element.clone();
    initialCopy.decorators.clear();

    let currentTarget: DDUIXElement[] = [initialCopy];

    for (const decorator of element.decorators.values.reverse()) {
      const decoratorDefinition = this.#definitions.decorators.get(decorator.identifier)!;
      const markup = decoratorDefinition.markup.clone();

      for (const placeholder of markup.placeholders) {
        // const targetClone = currentTarget.map((e) => e.clone());

        this.#targets.set(placeholder, currentTarget);
      }

      for (const e of markup) {
        e.resolveDecoratorValueReferences(decorator.value as DDUIXLayoutElementAttribute["value"]);
      }

      currentTarget = markup.body;
    }

    return currentTarget;
  }

  //#endregion

  //#region Ancestor Tree

  private assignOwnership(markup: DDUIXMarkup, owner: DDUIXElement) {
    for (const e of markup) {
      this.#owners.set(e, owner);
      e.resolveAttributeValueReferences(owner.attributes);
    }
  }

  private *getOwnerAncestorIterator(element: DDUIXElement) {
    while (this.#owners.has(element)) {
      const owner = this.#owners.get(element)!;
      yield owner;

      element = owner;
    }
  }

  private detectComponentCycle(element: DDUIXElement) {
    const elements = [element.component];

    for (const owner of this.getOwnerAncestorIterator(element)) {
      elements.push(owner.component);

      if (owner.component != element.component) continue;

      const stack = elements.reverse().join(" → ");

      throw new DDUIXCycleError(
        `Component expansion resulted in an infinite loop: ${stack}`,
        owner.component.source,
      );
    }
  }

  //#endregion
}
