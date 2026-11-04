import { DDUIXPlaceholderType } from "../enums";
import { DDUIXError, DDUIXReferenceError, DDUIXTypeError } from "../errors";
import { DDUIXIdentifierMap, DDUIXNamespacedIdentifier } from "../identifiers";
import {
  DDUIXAttributeValueReference,
  DDUIXDataStoreReference,
  DDUIXDecoratorValueReference,
  DDUIXReference,
} from "../references";
import { DDUIXSource } from "../source";
import { DDUIXBoolean, DDUIXValue } from "../value";

import { DDUIXElementAttribute, DDUIXElementDecorator } from "./attribute";

export class DDUIXElement {
  children?: DDUIXElement[];

  constructor(
    public readonly component: DDUIXNamespacedIdentifier,
    public readonly attributes: DDUIXIdentifierMap<DDUIXElementAttribute>,
    public readonly decorators: DDUIXIdentifierMap<DDUIXElementDecorator>,
    public readonly source: DDUIXSource,
  ) {}

  clone() {
    const clone = new DDUIXElement(
      this.component,
      this.attributes.clone(),
      this.decorators.clone(),
      this.source,
    );

    if (this.children) {
      clone.children = this.children.map((child) => child.clone());
    }

    return clone;
  }

  private resolveValueReference(
    attribute: DDUIXElementAttribute,
    reference: DDUIXReference,
    value: DDUIXValue | DDUIXDataStoreReference,
  ) {
    if (reference.isNegated) {
      if (value instanceof DDUIXDataStoreReference) {
        value = DDUIXDataStoreReference.negate(value);
      } else {
        value = DDUIXBoolean.negate(value);
      }
    }

    const newAttribute = new DDUIXElementAttribute(attribute.identifier, value, attribute.source);

    const map = attribute instanceof DDUIXElementDecorator ? this.decorators : this.attributes;
    map.add(newAttribute);
  }

  private resolveAttributeValueReference(
    componentAttributes: DDUIXIdentifierMap<DDUIXElementAttribute>,
    attribute: DDUIXElementAttribute,
  ) {
    const reference = attribute.value as DDUIXAttributeValueReference;

    if (!componentAttributes.has(reference.attribute)) {
      throw new DDUIXReferenceError(
        `No attribute named "${reference.attribute}" exists`,
        reference.source,
      );
    }

    const { value } = componentAttributes.get(reference.attribute)!;

    if (value instanceof DDUIXReference) {
      throw new TypeError("Unresolved reference");
    }

    this.resolveValueReference(attribute, reference, value);
  }

  resolveAttributeValueReferences(componentAttributes: DDUIXIdentifierMap<DDUIXElementAttribute>) {
    for (const attribute of this.attributes) {
      if (attribute.value instanceof DDUIXAttributeValueReference) {
        this.resolveAttributeValueReference(componentAttributes, attribute);
      } else if (attribute.value instanceof DDUIXDecoratorValueReference) {
        throw new DDUIXTypeError(`Unexpected decorator value reference`, attribute.value.source);
      }
    }

    for (const decorator of this.decorators) {
      if (decorator.value instanceof DDUIXAttributeValueReference) {
        this.resolveAttributeValueReference(componentAttributes, decorator);
      } else if (decorator.value instanceof DDUIXDecoratorValueReference) {
        throw new DDUIXTypeError(`Unexpected decorator value reference`, decorator.value.source);
      }
    }
  }

  resolveDecoratorValueReferences(decoratorValue: DDUIXValue | DDUIXDataStoreReference) {
    for (const attribute of this.attributes) {
      if (attribute.value instanceof DDUIXDecoratorValueReference) {
        this.resolveValueReference(attribute, attribute.value, decoratorValue);
      } else if (attribute.value instanceof DDUIXAttributeValueReference) {
        throw new DDUIXTypeError(
          `Unexpected component attribute value reference`,
          attribute.value.source,
        );
      }
    }

    for (const decorator of this.decorators) {
      if (decorator.value instanceof DDUIXDecoratorValueReference) {
        this.resolveValueReference(decorator, decorator.value, decoratorValue);
      } else if (decorator.value instanceof DDUIXAttributeValueReference) {
        throw new DDUIXTypeError(
          `Unexpected component attribute value reference`,
          decorator.value.source,
        );
      }
    }
  }
}

const placeholderIdentifier = new DDUIXNamespacedIdentifier(
  "dduix",
  "placeholder",
  DDUIXSource.Internal,
);

export class DDUIXPlaceholderElement extends DDUIXElement {
  constructor(
    public type: DDUIXPlaceholderType,
    public attributes: DDUIXIdentifierMap<DDUIXElementAttribute>,
    public decorators: DDUIXIdentifierMap<DDUIXElementDecorator>,
    source: DDUIXSource,
  ) {
    super(placeholderIdentifier, attributes, decorators, source);

    if (type === DDUIXPlaceholderType.ComponentChildren) {
      if (this.attributes.size > 0) {
        throw new DDUIXError("Children placeholder element cannot have attributes", source);
      }

      if (this.decorators.size > 0) {
        throw new DDUIXError("Children placeholder element cannot have decorators", source);
      }
    }
  }

  clone() {
    return new DDUIXPlaceholderElement(
      this.type,
      this.attributes.clone(),
      this.decorators.clone(),
      this.source,
    );
  }
}
