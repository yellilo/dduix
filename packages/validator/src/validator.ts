import {
  DDUIXAttributeDefinition,
  DDUIXAttributeValueReference,
  DDUIXColorStyleProperty,
  DDUIXColorStylePropertyDefinition,
  DDUIXComponentDefinition,
  DDUIXConstraint,
  DDUIXCycleError,
  DDUIXDataStoreReference,
  DDUIXDecoratorDefinition,
  DDUIXDecoratorValueReference,
  DDUIXDefinitions,
  DDUIXElement,
  DDUIXElementAttribute,
  DDUIXError,
  DDUIXIdentifierSet,
  DDUIXMissingAttributeError,
  DDUIXMissingStylePropertyError,
  DDUIXNamespacedIdentifier,
  DDUIXPlaceholderElement,
  DDUIXPlaceholderType,
  DDUIXReference,
  DDUIXReferenceError,
  DDUIXReservedNamespaceError,
  DDUIXRootDefinition,
  DDUIXStyleDeclaration,
  DDUIXStyleDefinition,
  DDUIXStyleProperty,
  DDUIXStylePropertyDefinition,
  DDUIXTypeError,
  DDUIXUnknownAttributeError,
  DDUIXUnknownStylePropertyError,
  DDUIXUnsupportedStylingError,
  DDUIXValue,
  DDUIXValueType,
} from "@dduix/core";
import { nativeComponentDefinitions } from "@dduix/native";

import { resolveOptions, type DDUIXValidatorOptions, type ResolvedOptions } from "./options";
import { markupHasPlaceholder } from "./utils";

export type MarkupContainerDefinition =
  | DDUIXRootDefinition
  | DDUIXComponentDefinition
  | DDUIXDecoratorDefinition;

export class DDUIXInternalValidator {
  options: ResolvedOptions;
  definitions: DDUIXDefinitions = new DDUIXDefinitions();
  readonly errors: DDUIXError[] = [];

  constructor(options?: DDUIXValidatorOptions) {
    this.options = resolveOptions(options);
  }

  validate(definitions: DDUIXDefinitions) {
    this.definitions = definitions;
    this.errors.length = 0;

    for (const definition of this.definitions.components) {
      this.validateComponentDefinition(definition);
    }

    for (const definition of this.definitions.decorators) {
      this.validateDecoratorDefinition(definition);
    }

    for (const definition of this.definitions.roots) {
      this.validateRootDefinition(definition);
    }

    for (const definition of this.definitions.styles) {
      this.validateStyleDefinition(definition);
    }
  }

  /** Checks that `identifier` does not make use of a reserved namespace. */
  private validateNamespacedIdentifier(identifier: DDUIXNamespacedIdentifier) {
    const { namespace, source } = identifier;
    const isNamespaceReserved = this.options.reservedNamespaces.includes(namespace);

    if (isNamespaceReserved) {
      this.raise(
        new DDUIXReservedNamespaceError(
          `Identifier "${identifier}" makes use of a reserved namespace "${namespace}"`,
          source,
        ),
      );
    }

    return !isNamespaceReserved;
  }

  private validateComponentDefinition(definition: DDUIXComponentDefinition) {
    const validIdentifier = this.validateNamespacedIdentifier(definition.identifier);
    const validAttributes = definition.attributes.values.every(definition =>
      this.validateComponentAttributeDefinition(definition),
    );
    const validMarkup = this.validateMarkup(definition);

    return validIdentifier && validAttributes && validMarkup;
  }

  private validateComponentAttributeDefinition(definition: DDUIXAttributeDefinition): boolean {
    const { constraint, defaultValue } = definition;

    if (defaultValue === null) return true;

    return this.validateAttributeValue(constraint, defaultValue);
  }

  private validateDecoratorDefinition(definition: DDUIXDecoratorDefinition): boolean {
    const validIdentifier = this.validateNamespacedIdentifier(definition.identifier);
    const validMarkup = this.validateMarkup(definition);

    const hasTargetPlaceholder = markupHasPlaceholder(
      definition.markup,
      DDUIXPlaceholderType.DecoratorTarget,
    );

    if (!hasTargetPlaceholder) {
      this.raise(
        new DDUIXError(
          "Decorator markup does not contain a target placeholder",
          definition.identifier.source,
        ),
      );
    }

    return validIdentifier && validMarkup && hasTargetPlaceholder;
  }

  private validateRootDefinition(definition: DDUIXRootDefinition): boolean {
    return (
      this.validateNamespacedIdentifier(definition.identifier) && this.validateMarkup(definition)
    );
  }

  //#region Markup

  private validateMarkup(scope: MarkupContainerDefinition): boolean {
    let valid = true;

    for (const element of scope.markup) {
      const elementValid = this.validateElement(element, scope);
      if (!elementValid) valid = false;
    }

    return valid;
  }

  private validateElement(element: DDUIXElement, scope: MarkupContainerDefinition): boolean {
    const isPlaceholder = element instanceof DDUIXPlaceholderElement;

    return isPlaceholder
      ? this.validatePlaceholder(element, scope)
      : this.validateComponent(element, scope);
  }

  private validateComponent(element: DDUIXElement, scope: MarkupContainerDefinition): boolean {
    const componentDefinition = this.getComponentDefinition(element.component);

    if (!componentDefinition) {
      this.raise(
        new DDUIXReferenceError(
          `Component "${element.component}" is not defined`,
          element.component.source,
        ),
      );
      return false;
    }

    return (
      this.validateComponentAttributes(element, componentDefinition, scope) &&
      this.validateComponentChildren(element, componentDefinition)
    );
  }

  private validateComponentChildren(
    element: DDUIXElement,
    componentDefinition: DDUIXComponentDefinition,
  ): boolean {
    const expectsChildren = markupHasPlaceholder(
      componentDefinition.markup,
      DDUIXPlaceholderType.ComponentChildren,
    );

    if (expectsChildren) {
      if (element.children) return false;

      this.raise(
        new DDUIXError(
          "Component expected children but none were provided",
          element.component.source,
        ),
      );
    } else {
      if (!element.children) return false;

      this.raise(
        new DDUIXError(
          "Component did not expect children so must use a self-closing tag",
          element.component.source,
        ),
      );
    }

    return true;
  }

  //#region Placeholders

  private validatePlaceholder(
    element: DDUIXPlaceholderElement,
    scope: MarkupContainerDefinition,
  ): boolean {
    switch (element.type) {
      case DDUIXPlaceholderType.ComponentChildren:
        return this.validateComponentChildrenPlaceholder(element, scope);
      case DDUIXPlaceholderType.DecoratorTarget:
        return this.validateDecoratorTargetPlaceholder(element, scope);
      default:
        this.raise(new DDUIXError("Unknown placeholder type", element.source));
        return false;
    }
  }

  private validateComponentChildrenPlaceholder(
    element: DDUIXPlaceholderElement,
    scope: MarkupContainerDefinition,
  ): boolean {
    let valid = true;
    if (!(scope instanceof DDUIXComponentDefinition)) {
      valid = false;
      this.raise(
        new DDUIXError(
          "This type of placeholder is only allowed inside component definitions",
          element.source,
        ),
      );
    }

    if (element.type === DDUIXPlaceholderType.ComponentChildren) {
      for (const attribute of element.attributes) {
        valid = false;
        this.raise(
          new DDUIXError("Attributes cannot be applied to children placeholders", attribute.source),
        );
      }
    }

    return valid;
  }

  private validateDecoratorTargetPlaceholder(
    element: DDUIXPlaceholderElement,
    scope: MarkupContainerDefinition,
  ): boolean {
    if (scope instanceof DDUIXDecoratorDefinition) return true;

    this.raise(
      new DDUIXError(
        "This type of placeholder is only allowed inside decorator definitions",
        element.source,
      ),
    );

    return false;
  }

  //#endregion

  //#region Attributes

  private validateComponentAttributes(
    element: DDUIXElement,
    componentDefinition: DDUIXComponentDefinition,
    scope: MarkupContainerDefinition,
  ): boolean {
    let valid = true;

    for (const definition of componentDefinition.attributes) {
      if (!element.attributes.has(definition.identifier) && !definition.isOptional) {
        valid = false;
        this.raise(
          new DDUIXMissingAttributeError(
            `Element is missing required attribute "${definition.identifier}"`,
            element.component.source,
          ),
        );
      }
    }

    for (const attribute of element.attributes) {
      const attributeValid = this.validateComponentAttribute(componentDefinition, attribute, scope);
      if (!attributeValid) valid = false;
    }

    return valid;
  }

  private validateComponentAttribute(
    componentDefinition: DDUIXComponentDefinition,
    attribute: DDUIXElementAttribute,
    scope: MarkupContainerDefinition,
  ): boolean {
    const attributeDefinition = componentDefinition.attributes.get(attribute.identifier);

    if (attributeDefinition === undefined) {
      this.raise(
        new DDUIXUnknownAttributeError(
          `No attribute with name "${attribute.identifier}" exists`,
          attribute.identifier.source,
        ),
      );
      return false;
    }

    if (attribute.value instanceof DDUIXReference) {
      // TODO: Data store type validation
      if (attribute.value instanceof DDUIXDataStoreReference) return true;

      const constraint = this.getConstraintOfReference(attribute.value, scope);
      if (constraint === undefined) return false;

      try {
        return constraint.subsetOf(attributeDefinition.constraint, true);
      } catch (e) {
        if (e instanceof DDUIXError) this.raise(e);
      }

      return false;
    }

    return this.validateAttributeValue(attributeDefinition.constraint, attribute.value);
  }

  private validateAttributeValue(constraint: DDUIXConstraint, value: DDUIXValue): boolean {
    try {
      return value.satisfies(constraint, true);
    } catch (e) {
      if (e instanceof DDUIXError) this.raise(e);
    }

    return false;
  }

  private getConstraintOfReference(reference: DDUIXReference, scope: MarkupContainerDefinition) {
    if (reference.isNegated) {
      return new DDUIXConstraint(DDUIXValueType.Boolean, reference.source);
    }

    if (
      scope instanceof DDUIXComponentDefinition &&
      reference instanceof DDUIXAttributeValueReference
    ) {
      const referencedAttributeDefinition = scope.attributes.get(reference.attribute);

      if (!referencedAttributeDefinition) {
        this.raise(
          new DDUIXUnknownAttributeError(
            `No attribute named "${reference.attribute}" exists`,
            reference.source,
          ),
        );
        return;
      }

      return referencedAttributeDefinition.constraint;
    }

    if (
      scope instanceof DDUIXDecoratorDefinition &&
      reference instanceof DDUIXDecoratorValueReference
    ) {
      return scope.constraint;
    }

    this.raise(
      new DDUIXReferenceError(
        "Referenced value is not available in the current scope",
        reference.source,
      ),
    );
  }

  //#endregion

  //#region Styling

  private validateStyleDefinition(definition: DDUIXStyleDefinition): boolean {
    const validIdentifier = this.validateNamespacedIdentifier(definition.identifier);
    const validInheritance = this.validateStyleDefinitionInheritance(definition);
    const validDeclarations = this.validateStyleDeclarations(definition);
    const complete = definition.isAbstract || this.validateStyleDefinitionComplete(definition);

    return validIdentifier && validInheritance && validDeclarations && complete;
  }

  private validateStyleDefinitionInheritance(definition: DDUIXStyleDefinition): boolean {
    if (!definition.base) return true;

    const baseDefinition = this.definitions.styles.get(definition.base);
    if (!baseDefinition) {
      this.raise(
        new DDUIXError(
          `Style definition with identifier "${definition.base}" does not exist`,
          definition.base.source,
        ),
      );
      return false;
    }

    const visited = new DDUIXIdentifierSet<DDUIXNamespacedIdentifier>();

    for (const { identifier } of definition.getInheritanceIterator(this.definitions.styles, true)) {
      if (!visited.has(identifier)) {
        visited.add(identifier);
        continue;
      }

      this.raise(
        new DDUIXCycleError(
          `Style definition inheritance chain contains an infinite cycle: ${[...visited, identifier].reverse().join(" → ")}`,
          definition.base.source,
        ),
      );
      return false;
    }

    return true;
  }

  private validateStyleDeclarations(definition: DDUIXStyleDefinition): boolean {
    let valid = true;

    for (const declaration of definition.declarations) {
      if (!this.validateStyleDeclaration(declaration)) valid = false;
    }

    return valid;
  }

  private validateStyleDeclaration(declaration: DDUIXStyleDeclaration) {
    const componentDefinition = nativeComponentDefinitions.get(declaration.component);
    if (!componentDefinition) {
      this.raise(
        new DDUIXUnsupportedStylingError(
          "Styling is only supported for select native components",
          declaration.component.source,
        ),
      );
      return false;
    }

    const propertyDefinitions = componentDefinition.styleProperties;
    if (propertyDefinitions.size === 0) {
      this.raise(
        new DDUIXUnsupportedStylingError(
          `Styling is not supported for the ${declaration.component} component`,
          declaration.component.source,
        ),
      );
      return false;
    }

    let propertiesValid = true;

    for (const property of declaration.properties) {
      const propertyDefinition = propertyDefinitions.get(property.identifier);
      if (!propertyDefinition) {
        this.raise(
          new DDUIXUnknownStylePropertyError(
            `Style property "${property.identifier}" does not exist for component "${declaration.component}"`,
            property.identifier.source,
          ),
        );
        propertiesValid = false;
        continue;
      }

      if (!this.validateStyleProperty(propertyDefinition, property)) {
        propertiesValid = false;
      }
    }

    return propertiesValid;
  }

  private validateStyleProperty(
    definition: DDUIXStylePropertyDefinition,
    property: DDUIXStyleProperty,
  ) {
    if (property instanceof DDUIXColorStyleProperty) {
      return this.validateColorStyleProperty(definition, property);
    }

    let valid = true;

    const parameterCount = property.parameters.length;
    const overload = definition.getOverload(parameterCount);
    if (!overload) {
      this.raise(
        new DDUIXTypeError(
          `No overload of style property "${property.identifier}" expects ${parameterCount} parameters`,
          property.identifier.source,
        ),
      );
      valid = false;
    }

    for (const parameter of property.parameters) {
      try {
        parameter.satisfies(definition.constraint, true);
      } catch (e) {
        if (e instanceof DDUIXError) {
          this.raise(e);
          valid = false;
        }
      }
    }

    return valid;
  }

  private validateColorStyleProperty(
    propertyDefinition: DDUIXStylePropertyDefinition,
    property: DDUIXColorStyleProperty,
  ) {
    if (propertyDefinition instanceof DDUIXColorStylePropertyDefinition) {
      if (!propertyDefinition.hasAlpha && property.color.alpha !== undefined) {
        this.raise(
          new DDUIXTypeError(
            `Style property "${property.identifier}" does not accept colors with an alpha channel`,
            property.color.source,
          ),
        );
        return false;
      }

      return true;
    }

    this.raise(
      new DDUIXTypeError(
        `Style property "${property.identifier}" does not accept color values`,
        property.color.source,
      ),
    );
    return false;
  }

  private validateStyleDefinitionComplete(definition: DDUIXStyleDefinition): boolean {
    let complete = true;

    const flattenedDeclarationIdentifiers = definition.getDeclarationIdentifiers(
      this.definitions.styles,
    );
    for (const declarationIdentifier of flattenedDeclarationIdentifiers) {
      const propertyDefinitions =
        nativeComponentDefinitions.get(declarationIdentifier)?.styleProperties;
      if (!propertyDefinitions) continue;

      const flattenedPropertyIdentifiers = definition.getDeclarationPropertyIdentifiers(
        this.definitions.styles,
        declarationIdentifier,
      );

      for (const propertyDefinition of propertyDefinitions) {
        const hasProperty = flattenedPropertyIdentifiers.has(propertyDefinition.identifier);

        if (hasProperty) {
          const flattenedParameterNames = this.getFlattenedStylePropertyParameterNames(
            definition,
            declarationIdentifier,
            propertyDefinition,
          );

          for (const name of propertyDefinition.parameters) {
            if (flattenedParameterNames.has(name)) continue;

            this.raise(
              new DDUIXMissingStylePropertyError(
                `Style declaration for "${declarationIdentifier}" is missing parameter "${name}" for property "${propertyDefinition.identifier}"`,
                definition.identifier.source,
              ),
            );
            complete = false;
          }
        } else if (!propertyDefinition.isOptional) {
          this.raise(
            new DDUIXMissingStylePropertyError(
              `Style declaration for "${declarationIdentifier}" is missing required property "${propertyDefinition.identifier}"`,
              definition.identifier.source,
            ),
          );
          complete = false;
        }
      }
    }

    return complete;
  }

  private getFlattenedStylePropertyParameterNames(
    styleDefinition: DDUIXStyleDefinition,
    componentIdentifier: DDUIXNamespacedIdentifier,
    propertyDefinition: DDUIXStylePropertyDefinition,
  ): Set<string> {
    const baseIdentifier = styleDefinition.base;
    const propertyIdentifier = propertyDefinition.identifier;

    const parameterNames = new Set<string>();

    if (baseIdentifier) {
      const baseDefinition = this.definitions.styles.get(baseIdentifier);

      if (baseDefinition) {
        const inheritedParameterNames = this.getFlattenedStylePropertyParameterNames(
          baseDefinition,
          componentIdentifier,
          propertyDefinition,
        );

        for (const name of inheritedParameterNames) {
          parameterNames.add(name);
        }
      }
    }

    const property = styleDefinition.getDeclarationProperty(
      componentIdentifier,
      propertyIdentifier,
    );

    if (!property) return parameterNames;

    const parameterCount = property.parameters.length;
    const overload = propertyDefinition.getOverload(parameterCount);
    if (!overload) return parameterNames;

    for (let i = 0; i < parameterCount; i++) {
      const name = overload.parameters[i];

      const aliased = propertyDefinition.getAlias(name);

      if (aliased) {
        for (const name of aliased) {
          parameterNames.add(name);
        }
      } else {
        parameterNames.add(name);
      }
    }

    return parameterNames;
  }

  //#endregion

  //#region Utilities

  private getComponentDefinition(identifier: DDUIXNamespacedIdentifier) {
    const componentDefinitions = this.definitions.components;

    return componentDefinitions.get(identifier) ?? nativeComponentDefinitions.get(identifier);
  }

  private raise(error: DDUIXError) {
    this.errors.push(error);
  }

  //#endregion
}
