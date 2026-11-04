import {
  DDUIXAttributeDefinition,
  DDUIXAttributeValueReference,
  DDUIXComponentDefinition,
  DDUIXConstraint,
  DDUIXDataStoreReference,
  DDUIXDecoratorDefinition,
  DDUIXDecoratorValueReference,
  DDUIXDefinitions,
  DDUIXElement,
  DDUIXElementAttribute,
  DDUIXError,
  DDUIXMissingAttributeError,
  DDUIXNamespacedIdentifier,
  DDUIXPlaceholderElement,
  DDUIXPlaceholderType,
  DDUIXReference,
  DDUIXReferenceError,
  DDUIXReservedNamespaceError,
  DDUIXRootDefinition,
  DDUIXUnknownAttributeError,
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
    return (
      this.validateNamespacedIdentifier(definition.identifier) &&
      definition.attributes.values.every(definition =>
        this.validateComponentAttributeDefinition(definition),
      ) &&
      this.validateMarkup(definition)
    );
  }

  private validateComponentAttributeDefinition(definition: DDUIXAttributeDefinition): boolean {
    const { constraint, defaultValue } = definition;

    if (defaultValue === null) return true;

    return this.validateAttributeValue(constraint, defaultValue);
  }

  private validateDecoratorDefinition(definition: DDUIXDecoratorDefinition): boolean {
    const validId = this.validateNamespacedIdentifier(definition.identifier);
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

    return validId && validMarkup && hasTargetPlaceholder;
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
