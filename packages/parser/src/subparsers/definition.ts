import {
  DDUIXDecoratorDefinition,
  DDUIXComponentDefinition,
  DDUIXIdentifierMap,
  DDUIXAttributeDefinition,
  DDUIXRootDefinition,
  DDUIXDuplicateIdentifierError,
  DDUIXPunctuation,
  DDUIXValue,
  DDUIXTypeError,
} from "@dduix/core";

import { DDUIXInternalSubparser } from "./subparser";
import { DDUIXNode, DDUIXNodeType } from "../tree";

export class DDUIXInternalDefinitionSubparser extends DDUIXInternalSubparser {
  parse() {
    const keyword = this.peekUntilWhitespace();

    switch (keyword) {
      case "component":
        return this.parseComponentDefinition();
      case "decorator":
        return this.parseDecoratorDefinition();
      case "root":
        return this.parseRootDefinition();
      case "abstract":
      case "style":
        return this.subparsers.styling.parseStyleDefinition();
      default:
        this.throw(`Unexpected token "${keyword}"`);
    }
  }

  parseAttributeDefinition() {
    const start = this.position;

    const identifierNode = this.subparsers.identifier.parseIdentifier(
      DDUIXNodeType.AttributeIdentifier,
    );
    const isNullable = this.accept(DDUIXPunctuation.Nullable);

    this.expectWhitespace();
    const constraintNode = this.subparsers.value.parseConstraint();

    this.skipWhitespace();

    let defaultValue: DDUIXValue | null = null;

    if (this.accept(DDUIXPunctuation.Assignment)) {
      if (isNullable) {
        throw new DDUIXTypeError(
          `Nullable attributes (marked with a "${DDUIXPunctuation.Nullable}") cannot have a default value`,
          identifierNode.source,
        );
      }

      this.skipWhitespace();

      const valueNode = this.subparsers.value.parseValue();
      const value = valueNode.data;

      defaultValue = value;
    }

    const definition = new DDUIXAttributeDefinition(
      identifierNode.data,
      constraintNode.data,
      isNullable,
      defaultValue,
      this.source(start),
    );

    const node = new DDUIXNode(DDUIXNodeType.AttributeDefinition, definition);
    node.addChild(identifierNode);
    node.addChild(constraintNode);

    return node;
  }

  parseDecoratorDefinition() {
    const start = this.position;

    this.expect("decorator");
    this.expectWhitespace();

    const identifierNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.DecoratorIdentifier,
    );
    this.expectWhitespace();

    const constraintNode = this.subparsers.value.parseConstraint();
    this.expectWhitespace();

    const markupNode = this.parseMarkupBlock();

    const definition = new DDUIXDecoratorDefinition(
      identifierNode.data,
      constraintNode.data,
      markupNode.data,
      this.source(start),
    );
    const node = new DDUIXNode(DDUIXNodeType.DecoratorDefinition, definition);
    node.addChild(identifierNode);
    node.addChild(constraintNode);
    node.addChild(markupNode);

    return node;
  }

  parseComponentDefinition() {
    const start = this.position;

    this.expect("component");
    this.expectWhitespace();

    const identifierNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.ComponentIdentifier,
    );

    this.skipWhitespace();
    const { attributeDefinitions, attributeDefinitionNodes } =
      this.parseComponentAttributeDefinitions();
    this.skipWhitespace();

    const markupNode = this.parseMarkupBlock();

    const definition = new DDUIXComponentDefinition(
      identifierNode.data,
      attributeDefinitions,
      markupNode.data,
      this.source(start),
    );

    const node = new DDUIXNode(DDUIXNodeType.ComponentDefinition, definition);
    node.addChild(identifierNode);
    node.addChildren(attributeDefinitionNodes);
    node.addChild(markupNode);

    return node;
  }

  parseComponentAttributeDefinitions() {
    const nodes: DDUIXNode<DDUIXNodeType.AttributeDefinition>[] = [];
    const attributes = new DDUIXIdentifierMap<DDUIXAttributeDefinition>();

    this.expect(DDUIXPunctuation.AttributeDefinitionsOpen);
    this.skipWhitespace();

    while (!this.accept(DDUIXPunctuation.AttributeDefinitionsClose)) {
      const attributeDefinitionNode = this.parseAttributeDefinition();
      const attribute = attributeDefinitionNode.data;

      nodes.push(attributeDefinitionNode);

      if (attributes.has(attribute)) {
        this.errors.push(
          new DDUIXDuplicateIdentifierError(
            `An attribute with the identifier "${attribute.identifier}" has already been defined`,
            attribute.identifier.source,
          ),
        );
      } else {
        attributes.add(attribute);
      }

      this.skipWhitespace();

      if (this.accept(DDUIXPunctuation.Comma)) {
        this.skipWhitespace();
      } else {
        this.expect(DDUIXPunctuation.AttributeDefinitionsClose);
        break;
      }
    }

    return { attributeDefinitions: attributes, attributeDefinitionNodes: nodes };
  }

  parseRootDefinition() {
    const start = this.position;

    this.expect("root");
    this.expectWhitespace();

    const identifierNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.RootIdentifier,
    );

    this.expectWhitespace();
    this.expect("at");
    this.expectWhitespace();

    const rootPointNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.RootPointIdentifier,
    );

    this.skipWhitespace();
    const markupNode = this.parseMarkupBlock();

    const definition = new DDUIXRootDefinition(
      identifierNode.data,
      rootPointNode.data,
      markupNode.data,
      this.source(start),
    );
    const node = new DDUIXNode(DDUIXNodeType.RootDefinition, definition);
    node.addChild(identifierNode);
    node.addChild(rootPointNode);
    node.addChild(markupNode);

    return node;
  }

  parseMarkupBlock() {
    this.expect(DDUIXPunctuation.MarkupOpen);
    const markup = this.subparsers.markup.parse();
    this.expect(DDUIXPunctuation.MarkupClose);

    return markup;
  }
}
