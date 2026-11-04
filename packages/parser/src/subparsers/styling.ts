import {
  DDUIXColor,
  DDUIXColorStyleProperty,
  DDUIXDuplicateIdentifierError,
  DDUIXError,
  DDUIXIdentifier,
  DDUIXIdentifierMap,
  DDUIXPunctuation,
  DDUIXStyleDeclaration,
  DDUIXStyleDefinition,
  DDUIXStyleProperty,
  DDUIXValue,
} from "@dduix/core";

import { DDUIXNode, DDUIXNodeType, type DDUIXNodeUnion } from "../tree";
import { DDUIXRegExp } from "../regExp";

import { DDUIXInternalSubparser } from "./subparser";

export class DDUIXInternalStylingSubparser extends DDUIXInternalSubparser {
  parseStyleDefinition() {
    const start = this.position;

    const isAbstract = this.accept("abstract");
    if (isAbstract) this.expectWhitespace();

    this.expect("style");
    this.expectWhitespace();

    const identifierNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.StyleIdentifier,
    );

    let baseNode: DDUIXNode<DDUIXNodeType.StyleIdentifier> | undefined;
    if (this.skipWhitespace() && this.accept("extends")) {
      this.expectWhitespace();
      baseNode = this.subparsers.identifier.parseNamespacedIdentifier(
        DDUIXNodeType.StyleIdentifier,
      );
      this.skipWhitespace();
    }

    this.expect(DDUIXPunctuation.StyleDeclarationListOpen);
    this.skipWhitespace();

    const declarations: DDUIXStyleDeclaration[] = [];
    const declarationNodes: DDUIXNode<DDUIXNodeType.StyleDeclaration>[] = [];

    while (!this.accept(DDUIXPunctuation.StyleDeclarationListClose)) {
      const declarationNode = this.parseStyleDeclaration();
      declarationNodes.push(declarationNode);
      declarations.push(declarationNode.data);

      this.skipWhitespace();
    }

    const definition = new DDUIXStyleDefinition(
      identifierNode.data,
      baseNode?.data,
      isAbstract,
      declarations,
      this.source(start),
    );

    const node = new DDUIXNode(DDUIXNodeType.StyleDefinition, definition);
    node.addChild(identifierNode);
    if (baseNode) node.addChild(baseNode);
    node.addChildren(declarationNodes);

    return node;
  }

  parseStyleDeclaration() {
    const start = this.position;

    const identifierNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.ComponentIdentifier,
    );
    this.skipWhitespace();
    this.expect(DDUIXPunctuation.StyleDeclarationOpen);

    const properties = new DDUIXIdentifierMap<DDUIXStyleProperty>();
    const propertyNodes: DDUIXNode<DDUIXNodeType.StyleProperty>[] = [];

    this.skipWhitespace();

    while (!this.accept(DDUIXPunctuation.StyleDeclarationClose)) {
      try {
        const propertyNode = this.parseStyleProperty();
        propertyNodes.push(propertyNode);

        const property = propertyNode.data;

        if (properties.has(property)) {
          this.errors.push(
            new DDUIXDuplicateIdentifierError(
              `Style property "${property.identifier}" already defined`,
              property.identifier.source,
            ),
          );
        } else {
          properties.add(property);
        }
      } catch (e) {
        if (e instanceof DDUIXError) this.errors.push(e);
        if (!this.startsWith(DDUIXPunctuation.StyleDeclarationClose)) {
          this.skipPast("\n");
        }
      }

      this.skipWhitespace();
    }

    const declaration = new DDUIXStyleDeclaration(
      identifierNode.data,
      properties,
      this.source(start),
    );

    const node = new DDUIXNode(DDUIXNodeType.StyleDeclaration, declaration);
    node.addChild(identifierNode);
    node.addChildren(propertyNodes);

    return node;
  }

  parseStyleProperty() {
    const start = this.position;
    const identifier = this.parseStylePropertyIdentifier();

    this.skipWhitespace();
    this.expect(DDUIXPunctuation.Assignment);
    this.skipWhitespace();

    let property: DDUIXStyleProperty;
    const parameterNodes: DDUIXNodeUnion[] = [];

    // Color property
    if (this.peek() === DDUIXPunctuation.ColorPrefix) {
      const colorNode = this.parseColor();
      this.skipWhitespace();
      this.expect(DDUIXPunctuation.StylePropertyDelimeter);

      property = new DDUIXColorStyleProperty(identifier, colorNode.data, this.source(start));
      parameterNodes.push(colorNode);
    }
    // Property with regular parameters
    else {
      const parameters: DDUIXValue[] = [];

      while (!this.accept(DDUIXPunctuation.StylePropertyDelimeter)) {
        const valueNode = this.subparsers.value.parseValue();
        parameterNodes.push(valueNode);
        parameters.push(valueNode.data);

        if (!this.skipWhitespace()) {
          this.expect(DDUIXPunctuation.StylePropertyDelimeter);
          break;
        }
      }

      property = new DDUIXStyleProperty(identifier, parameters, this.source(start));
    }

    const node = new DDUIXNode(DDUIXNodeType.StyleProperty, property);
    node.addChild(new DDUIXNode(DDUIXNodeType.StylePropertyIdentifier, identifier));
    node.addChildren(parameterNodes);

    return node;
  }

  parseStylePropertyIdentifier(): DDUIXIdentifier {
    const start = this.position;
    const name = this.match(DDUIXRegExp.Identifier);
    if (!name) this.throw("Invalid style property name");

    this.advance(name.length);
    return new DDUIXIdentifier(name, this.source(start));
  }

  parseColor() {
    const start = this.position;
    this.expect(DDUIXPunctuation.ColorPrefix);

    let hex = "";

    while (this.match(DDUIXRegExp.HexDigit) && hex.length < 8) {
      hex += this.pop();
    }

    if (hex.length !== 6 && hex.length !== 8) {
      this.throw("Expected 6-digit RGB color or 8-digit RGBA color", start);
    }

    const source = this.source(start);

    const red = fromHex(hex.slice(0, 2));
    const green = fromHex(hex.slice(2, 4));
    const blue = fromHex(hex.slice(4, 6));

    let color: DDUIXColor;

    if (hex.length === 6) {
      color = new DDUIXColor(red, green, blue, source);
    } else {
      const alpha = fromHex(hex.slice(6, 8));
      color = new DDUIXColor(red, green, blue, alpha, source);
    }

    return new DDUIXNode(DDUIXNodeType.Color, color);
  }
}

function fromHex(hex: string) {
  return parseInt(hex, 16);
}
