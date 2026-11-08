import {
  DDUIXCycleError,
  DDUIXDefinitions,
  DDUIXElement,
  DDUIXError,
  DDUIXIdentifier,
  DDUIXMarkup,
  DDUIXNamespacedIdentifier,
  DDUIXPlaceholderElement,
  DDUIXPlaceholderType,
  DDUIXSource,
  DDUIXStyleDefinition,
  DDUIXStylePropertyDefinition,
  DDUIXValue,
  type DDUIXRootDefinition,
} from "@dduix/core";
import { DDUIXNativeComponentDefinition, nativeComponentDefinitions } from "@dduix/native";

import {
  DDUIXLayoutElement,
  type DDUIXLayoutElementAttribute,
  type DDUIXLayoutElementAttributes,
} from "./layoutElement";
import { DDUIBuilder, type DDUIRoot, type DDUIStyle } from "./ddui";

export class DDUIXCompiler {
  constructor() {}

  #definitions: DDUIXDefinitions = new DDUIXDefinitions();
  /** Maps elements to the element that included it in its markup */
  readonly #owners = new Map<DDUIXElement, DDUIXElement>();
  /** Maps target placeholders to the elements they are targeting */
  readonly #targets = new Map<DDUIXPlaceholderElement, DDUIXElement[]>();

  compiledRoots: DDUIRoot[] = [];
  compiledStyles: DDUIStyle[] = [];

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

  public compileStyles(definitions: DDUIXDefinitions) {
    this.#definitions = definitions;
    this.compiledStyles = [];

    for (const definition of definitions.styles) {
      if (definition.isAbstract) continue;
      this.compiledStyles.push(this.compileStyleDefinition(definition));
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

      if (owner.component.toString() !== element.component.toString()) continue;

      const stack = elements.reverse().join(" → ");

      throw new DDUIXCycleError(
        `Component expansion resulted in an infinite loop: ${stack}`,
        owner.component.source,
      );
    }
  }

  //#endregion

  //#region Styling

  private compileStyleDefinition(definition: DDUIXStyleDefinition): DDUIStyle {
    const declarations: Record<string, Record<string, unknown>> = {};

    for (const [component, properties] of this.flattenStyleDeclarations(definition)) {
      const props: Record<string, unknown> = {};

      for (const [name, value] of properties) {
        props[name.toString()] = value;
      }

      declarations[component.toString()] = props;
    }

    return DDUIBuilder.createStyle(definition.identifier, declarations);
  }

  private flattenStyleDeclarations(styleDefinition: DDUIXStyleDefinition) {
    const declarationMap: FlattenedStyleDeclarationMap = new Map();

    for (const identifier of styleDefinition.getDeclarationIdentifiers(this.#definitions.styles)) {
      const properties = this.flattenStyleDeclarationProperties(styleDefinition, identifier);
      declarationMap.set(identifier, properties);
    }

    return declarationMap;
  }

  private flattenStyleDeclarationProperties(
    styleDefinition: DDUIXStyleDefinition,
    componentIdentifier: DDUIXNamespacedIdentifier,
  ) {
    const propertyMap: FlattenedStylePropertyMap = new Map();

    const componentDefinition = nativeComponentDefinitions.get(componentIdentifier);
    const propertyDefinitions = componentDefinition?.styleProperties;

    if (!propertyDefinitions) {
      throw new DDUIXError("Failed to get available style properties", componentIdentifier.source);
    }

    for (const propertyDefinition of propertyDefinitions) {
      const parameters = this.flattenStylePropertyParameters(
        styleDefinition,
        componentIdentifier,
        propertyDefinition,
      );

      if (!parameters) continue;
      propertyMap.set(propertyDefinition.identifier, propertyDefinition.getJSON(parameters));
    }

    return propertyMap;
  }

  private flattenStylePropertyParameters(
    styleDefinition: DDUIXStyleDefinition,
    componentIdentifier: DDUIXNamespacedIdentifier,
    propertyDefinition: DDUIXStylePropertyDefinition,
  ): Record<string, DDUIXValue> | undefined {
    const baseIdentifier = styleDefinition.base;
    const propertyIdentifier = propertyDefinition.identifier;

    let parameters: Record<string, DDUIXValue> | undefined;

    if (baseIdentifier) {
      const baseDefinition = this.#definitions.styles.get(baseIdentifier);
      if (!baseDefinition) throw new DDUIXError("Unknown base style", baseIdentifier.source);

      const inheritedParameters = this.flattenStylePropertyParameters(
        baseDefinition,
        componentIdentifier,
        propertyDefinition,
      );

      if (inheritedParameters) {
        parameters = { ...inheritedParameters };
      }
    }

    const property = styleDefinition.getDeclarationProperty(
      componentIdentifier,
      propertyIdentifier,
    );

    if (!property) return parameters;

    const parameterCount = property.parameters.length;
    const overload = propertyDefinition.getOverload(parameterCount);
    if (!overload) throw new DDUIXError("No property overload matched", property.source);

    parameters ??= {};

    for (let i = 0; i < parameterCount; i++) {
      const name = overload.parameters[i];
      const value = property.parameters[i];

      const aliased = propertyDefinition.getAlias(name);

      if (aliased) {
        for (const name of aliased) {
          parameters[name] = value;
        }
      } else {
        parameters[name] = value;
      }
    }

    return parameters;
  }

  //#endregion
}

type FlattenedStyleDeclarationMap = Map<DDUIXIdentifier, FlattenedStylePropertyMap>;
type FlattenedStylePropertyMap = Map<DDUIXIdentifier, unknown>;
