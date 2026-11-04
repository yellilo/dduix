import {
  DDUIXAttributeValueReference,
  DDUIXDataStoreReference,
  DDUIXDecoratorValueReference,
  DDUIXReference,
  DDUIXString,
  DDUIXBoolean,
  DDUIXInteger,
  DDUIXFloat,
  DDUIXKeywords,
  DDUIXPunctuation,
  DDUIXValueType,
  DDUIXConstraint,
  DDUIXEnumConstraint,
  DDUIXTypeError,
  DDUIXRangeConstraint,
} from "@dduix/core";

import { DDUIXRegExp } from "../regExp";

import { DDUIXInternalSubparser } from "./subparser";
import { DDUIXNode, DDUIXNodeType, type DDUIXNodeUnion } from "../tree";

export class DDUIXInternalValueSubparser extends DDUIXInternalSubparser {
  //#region Value Type

  parseType() {
    const start = this.position;

    const keyword = this.popUntil(
      DDUIXRegExp.Whitespace,
      DDUIXPunctuation.ConstraintDomainOpen,
      DDUIXPunctuation.Assignment,
      DDUIXPunctuation.Comma,
      DDUIXPunctuation.AttributeDefinitionsClose,
    );

    if (DDUIXKeywords.ValueType.hasKeyword(keyword)) {
      return new DDUIXNode(
        DDUIXNodeType.ValueType,
        DDUIXKeywords.ValueType.getValue(keyword)!,
        this.source(start),
      );
    }

    this.throw("Invalid value type", start);
  }

  parseConstraint() {
    const start = this.position;

    const typeNode = this.parseType();
    const type = typeNode.data;

    const childNodes: DDUIXNodeUnion[] = [];
    childNodes.push(typeNode);

    let constraint: DDUIXConstraint;

    if (this.startsWith(DDUIXPunctuation.ConstraintDomainOpen)) {
      if (type === DDUIXValueType.String) {
        const { values, nodes } = this.parseEnumConstraintDomain();
        childNodes.push(...nodes);

        constraint = new DDUIXEnumConstraint(values, this.source(start));
      } else if (type === DDUIXValueType.Float || type === DDUIXValueType.Integer) {
        const [minNode, maxNode] = this.parseRangeConstraintDomain();
        if (minNode) childNodes.push(minNode);
        if (maxNode) childNodes.push(maxNode);

        const minValue = (minNode?.data ?? null) as DDUIXFloat | DDUIXInteger | null;
        const maxValue = (maxNode?.data ?? null) as DDUIXFloat | DDUIXInteger | null;

        let validRange = true;

        if (minValue !== null && maxValue !== null && minValue.value >= maxValue.value) {
          validRange = false;

          this.errors.push(
            new DDUIXTypeError("Maximum value must be greater than minimum value", maxValue.source),
          );
        }

        if (type === DDUIXValueType.Integer && minValue?.type === DDUIXValueType.Float) {
          validRange = false;

          this.errors.push(
            new DDUIXTypeError("Expected minimum value of type integer", minValue.source),
          );
        }

        if (type === DDUIXValueType.Integer && maxValue?.type === DDUIXValueType.Float) {
          validRange = false;

          this.errors.push(
            new DDUIXTypeError("Expected maximum value of type integer", maxValue.source),
          );
        }

        if (validRange) {
          constraint = new DDUIXRangeConstraint(type, minValue, maxValue, this.source(start));
        }
      }
    }

    constraint ??= new DDUIXConstraint(type, this.source(start));

    const node = new DDUIXNode(DDUIXNodeType.Constraint, constraint);
    node.addChildren(childNodes);

    return node;
  }

  parseEnumConstraintDomain() {
    this.expect(DDUIXPunctuation.ConstraintDomainOpen);

    const nodes: DDUIXNode<DDUIXNodeType.Value>[] = [];
    const values: DDUIXString[] = [];

    do {
      this.skipWhitespace();

      const node = this.parseStringValue();
      nodes.push(node);
      values.push(node.data as DDUIXString);

      this.skipWhitespace();
    } while (this.accept(DDUIXPunctuation.EnumSeparator));

    this.expect(DDUIXPunctuation.ConstraintDomainClose);

    return { values, nodes };
  }

  parseRangeConstraintDomain(): [
    minNode: DDUIXNode<DDUIXNodeType.Value> | undefined,
    maxNode: DDUIXNode<DDUIXNodeType.Value> | undefined,
  ] {
    this.expect(DDUIXPunctuation.ConstraintDomainOpen);
    this.skipWhitespace();

    const minNode = this.tryParseNumericValue();
    this.expect(DDUIXPunctuation.RangeSeparator);
    const maxNode = this.tryParseNumericValue();

    this.skipWhitespace();
    this.expect(DDUIXPunctuation.ConstraintDomainClose);

    return [minNode, maxNode];
  }

  //#endregion

  //#region Value

  parseValueOrReference() {
    const startChar = this.peek();

    if (startChar === DDUIXPunctuation.ReferenceOpen) {
      return this.parseReference();
    }

    return this.parseValue();
  }

  parseValue() {
    const startChar = this.peek();

    // String
    if (DDUIXPunctuation.Quotes.includes(startChar)) {
      return this.parseStringValue();
    }

    // Other types
    return (
      this.tryParseBooleanValue() ??
      this.tryParseNumericValue() ??
      this.throw("Invalid attribute value")
    );
  }

  parseReference() {
    this.expect(DDUIXPunctuation.ReferenceOpen);
    this.skipWhitespace();

    const start = this.position;

    let result: DDUIXReference;
    const isNegated = this.accept(DDUIXPunctuation.Negation);

    if (this.accept("context.")) {
      const path = this.match(DDUIXRegExp.Identifier);
      if (!path) this.throw("Invalid data store path");

      this.advance(path.length);
      result = new DDUIXDataStoreReference(path, true, isNegated, this.source(start));
    } else if (this.accept("this.")) {
      const { data: attribute } = this.subparsers.identifier.parseIdentifier(
        DDUIXNodeType.AttributeIdentifier,
      );
      result = new DDUIXAttributeValueReference(attribute, isNegated, this.source(start));
    } else if (this.accept("this")) {
      result = new DDUIXDecoratorValueReference(isNegated, this.source(start));
    } else {
      this.throw("Invalid reference expression");
    }

    this.skipWhitespace();
    this.expect(DDUIXPunctuation.ReferenceClose);

    return new DDUIXNode(DDUIXNodeType.Reference, result);
  }

  parseStringValue() {
    let string = "";
    const start = this.position;

    if (!DDUIXPunctuation.Quotes.includes(this.peek())) {
      this.throw("Expected string");
    }

    const quote = this.pop();

    while (!this.accept(quote)) {
      const char = this.peek();

      if (!char || char === "\n") {
        this.throw("Unterminated string value", start);
      }

      if (char === DDUIXPunctuation.StringEscape) {
        string += this.parseStringEscape();
      } else {
        string += char;
        this.advance();
      }
    }

    return new DDUIXNode(DDUIXNodeType.Value, new DDUIXString(string, this.source(start)));
  }

  parseStringEscape() {
    this.expect(DDUIXPunctuation.StringEscape);

    const char = this.pop();

    if (char === "n") return "\n"; // Line break
    if (char === "r") return "\r"; // Carriage return
    if (char === "t") return "\t"; // Tab
    if (char === "u") return String.fromCodePoint(this.parseHexCodePoint());

    return char;
  }

  parseHexCodePoint() {
    const start = this.position;
    let hex = "";

    while (this.match(DDUIXRegExp.HexDigit) && hex.length < 4) {
      hex += this.pop();
    }

    if (hex.length < 4) {
      this.throw("Expected 4-digit hexadecimal code point", start);
    }

    return parseInt(hex, 16);
  }

  tryParseBooleanValue() {
    const start = this.position;

    const keyword = DDUIXKeywords.Boolean.keywords.find(keyword => this.accept(keyword));
    if (!keyword) return;

    const boolean = DDUIXKeywords.Boolean.getValue(keyword)!;
    return new DDUIXNode(DDUIXNodeType.Value, new DDUIXBoolean(boolean, this.source(start)));
  }

  tryParseNumericValue() {
    const start = this.position;

    const numberString = this.match(DDUIXRegExp.Number);
    if (!numberString) return;

    this.advance(numberString.length);

    const number = parseFloat(numberString);
    const isFloat = numberString.includes(DDUIXPunctuation.DecimalPoint);

    const source = this.source(start);
    const value = isFloat ? new DDUIXFloat(number, source) : new DDUIXInteger(number, source);

    return new DDUIXNode(DDUIXNodeType.Value, value);
  }

  //#endregion
}
