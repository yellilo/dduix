import {
  DDUIXMarkup,
  DDUIXElement,
  DDUIXPlaceholderElement,
  DDUIXIdentifierMap,
  DDUIXElementAttribute,
  DDUIXElementDecorator,
  DDUIXValue,
  DDUIXReference,
  DDUIXBoolean,
  DDUIXKeywords,
  DDUIXPunctuation,
  DDUIXNamespacedIdentifier,
  DDUIXDuplicateIdentifierError,
} from "@dduix/core";
import { DDUIXRegExp } from "../regExp";
import { DDUIXInternalSubparser } from "./subparser";
import { DDUIXNode, DDUIXNodeType, type DDUIXNodeUnion } from "../tree";

export class DDUIXInternalMarkupSubparser extends DDUIXInternalSubparser {
  parse() {
    const markup = new DDUIXMarkup([], this.source());
    const node = new DDUIXNode(DDUIXNodeType.Markup, markup);

    this.skipWhitespace();

    while (!this.startsWith(DDUIXPunctuation.MarkupClose)) {
      const elementNode = this.parseElement();
      node.addChild(elementNode);
      markup.body.push(elementNode.data);
      this.skipWhitespace();
    }

    markup.source.end = this.position;

    return node;
  }

  parseElement() {
    const start = this.position;
    const startTagNode = new DDUIXNode(DDUIXNodeType.ElementStartTag, null, this.source(start));

    this.expect(DDUIXPunctuation.ElementStartTagOpen);

    const keyword = this.peekUntil(
      DDUIXRegExp.Whitespace,
      DDUIXPunctuation.ElementStartTagClose,
      DDUIXPunctuation.ElementStartTagSelfClose,
    );

    if (DDUIXKeywords.PlaceholderType.hasKeyword(keyword)) {
      const placeholderTypeStart = this.position;
      const placeholderType = DDUIXKeywords.PlaceholderType.getValue(keyword)!;

      this.advance(keyword.length);
      this.assertWhitespaceOrStartTagTerminator();

      startTagNode.addChild(
        new DDUIXNode(
          DDUIXNodeType.PlaceholderType,
          placeholderType,
          this.source(placeholderTypeStart),
        ),
      );

      this.skipWhitespace();
      const { attributes, decorators } = this.parseElementAttributes();
      this.skipWhitespace();

      this.expect(DDUIXPunctuation.ElementStartTagSelfClose);

      startTagNode.source.end = this.position;
      const source = this.source(start);

      const element = new DDUIXPlaceholderElement(placeholderType, attributes, decorators, source);
      const elementNode = new DDUIXNode(DDUIXNodeType.Element, element);
      elementNode.addChild(startTagNode);

      return elementNode;
    }

    const componentIdentifierNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.ComponentIdentifier,
    );
    this.assertWhitespaceOrStartTagTerminator();

    startTagNode.addChild(componentIdentifierNode);

    this.skipWhitespace();
    const { attributes, decorators, nodes: attributeNodes } = this.parseElementAttributes();
    this.skipWhitespace();

    startTagNode.addChildren(attributeNodes);

    const source = this.source(start);
    const element = new DDUIXElement(componentIdentifierNode.data, attributes, decorators, source);
    const elementNode = new DDUIXNode(DDUIXNodeType.Element, element);
    elementNode.addChild(startTagNode);

    if (this.accept(DDUIXPunctuation.ElementStartTagSelfClose)) {
      startTagNode.source.end = this.position;
      source.end = this.position;
      return elementNode;
    }

    if (!this.accept(DDUIXPunctuation.ElementStartTagClose)) {
      this.throw("Expected whitespace or end of tag after component name");
    }

    startTagNode.source.end = this.position;

    element.children = [];
    const childrenNode = new DDUIXNode(DDUIXNodeType.ElementChildren, null, this.source());
    elementNode.addChild(childrenNode);

    this.skipWhitespace();

    while (!this.startsWith(DDUIXPunctuation.ElementEndTagOpen)) {
      const childNode = this.parseElement();
      childrenNode.addChild(childNode);
      element.children.push(childNode.data);

      this.skipWhitespace();
    }

    childrenNode.source.end = this.position;

    const endTagNode = this.parseElementEndTag(componentIdentifierNode.data);
    elementNode.addChild(endTagNode);

    source.end = this.position;

    return elementNode;
  }

  parseElementEndTag(expectedName: DDUIXNamespacedIdentifier) {
    const start = this.position;

    this.expect(DDUIXPunctuation.ElementEndTagOpen);
    const nameNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.ComponentIdentifier,
    );
    this.expect(DDUIXPunctuation.ElementEndTagClose);

    if (nameNode.data.toString() != expectedName.toString()) {
      this.throw(`Expected corresponding end tag for element "${expectedName}"`, start);
    }

    const node = new DDUIXNode(DDUIXNodeType.ElementEndTag, null, this.source(start));
    node.addChild(nameNode);

    return node;
  }

  parseElementAttributes() {
    const nodes: DDUIXNodeUnion<DDUIXNodeType.ElementAttribute | DDUIXNodeType.ElementDecorator>[] =
      [];

    const attributes = new DDUIXIdentifierMap<DDUIXElementAttribute>();
    const decorators = new DDUIXIdentifierMap<DDUIXElementDecorator>();

    while (!this.startsWithStartTagTerminator()) {
      const isDecorator = this.accept(DDUIXPunctuation.ElementDecoratorPrefix);

      if (isDecorator) {
        const node = this.parseElementDecorator();
        nodes.push(node);

        const decorator = node.data;

        if (decorators.has(decorator)) {
          this.errors.push(
            new DDUIXDuplicateIdentifierError(
              `Decorator "${decorator.identifier}" already defined`,
              decorator.identifier.source,
            ),
          );
        } else {
          decorators.add(decorator);
        }
      } else {
        const node = this.parseElementAttribute();
        nodes.push(node);

        const attribute = node.data;

        if (attributes.has(attribute)) {
          this.errors.push(
            new DDUIXDuplicateIdentifierError(
              `Attribute "${attribute.identifier}" already defined`,
              attribute.identifier.source,
            ),
          );
        } else {
          attributes.add(attribute);
        }
      }

      this.assertWhitespaceOrStartTagTerminator();
      this.skipWhitespace();
    }

    return { attributes, decorators, nodes };
  }

  parseElementAttribute() {
    const start = this.position;
    const identifierNode = this.subparsers.identifier.parseIdentifier(
      DDUIXNodeType.AttributeIdentifier,
    );

    let value: DDUIXValue | DDUIXReference = new DDUIXBoolean(true, identifierNode.source);
    let valueNode: DDUIXNodeUnion<DDUIXNodeType.Value | DDUIXNodeType.Reference> | undefined;

    if (this.accept(DDUIXPunctuation.Assignment)) {
      valueNode = this.subparsers.value.parseValueOrReference();
      value = valueNode.data;
    }

    const attribute = new DDUIXElementAttribute(identifierNode.data, value, this.source(start));

    const node = new DDUIXNode(DDUIXNodeType.ElementAttribute, attribute);
    node.addChild(identifierNode);
    if (valueNode) node.addChild(valueNode);

    return node;
  }

  parseElementDecorator() {
    const start = this.position;
    const identifierNode = this.subparsers.identifier.parseNamespacedIdentifier(
      DDUIXNodeType.DecoratorIdentifier,
    );

    let value: DDUIXValue | DDUIXReference = new DDUIXBoolean(true, identifierNode.source);
    let valueNode: DDUIXNodeUnion<DDUIXNodeType.Value | DDUIXNodeType.Reference> | undefined;

    if (this.accept(DDUIXPunctuation.Assignment)) {
      valueNode = this.subparsers.value.parseValueOrReference();
      value = valueNode.data;
    }

    const decorator = new DDUIXElementDecorator(identifierNode.data, value, this.source(start));

    const node = new DDUIXNode(DDUIXNodeType.ElementDecorator, decorator);
    node.addChild(identifierNode);
    if (valueNode) node.addChild(valueNode);

    return node;
  }

  startsWithStartTagTerminator() {
    return (
      this.startsWith(DDUIXPunctuation.ElementStartTagClose) ||
      this.startsWith(DDUIXPunctuation.ElementStartTagSelfClose)
    );
  }

  assertWhitespaceOrStartTagTerminator() {
    if (this.match(DDUIXRegExp.Whitespace) || this.startsWithStartTagTerminator()) {
      return;
    }

    this.throw("Expected whitespace or end of tag");
  }
}
