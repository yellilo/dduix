import { DDUIXIdentifier, DDUIXNamespacedIdentifier, DDUIXPunctuation } from "@dduix/core";

import { DDUIXRegExp } from "../regExp";

import { DDUIXInternalSubparser } from "./subparser";
import { DDUIXNode, DDUIXNodeType, type DDUIXNodeTypeDataMap, type DDUIXNodeUnion } from "../tree";

type NodeTypesWithData<T> = {
  [K in keyof DDUIXNodeTypeDataMap]: DDUIXNodeTypeDataMap[K] extends T ? K : never;
}[DDUIXNodeType];

type NamespacedIdentifierNodeTypeUnion = NodeTypesWithData<DDUIXNamespacedIdentifier>;
type IdentifierNodeTypeUnion = Exclude<
  NodeTypesWithData<DDUIXIdentifier>,
  NamespacedIdentifierNodeTypeUnion
>;

export class DDUIXInternalIdentifierSubparser extends DDUIXInternalSubparser {
  parseIdentifier<T extends IdentifierNodeTypeUnion>(nodeType: T): DDUIXNodeUnion<T> {
    const start = this.position;

    const name = this.match(DDUIXRegExp.Identifier);
    if (!name) {
      this.throw(
        `Invalid ${nodeType === DDUIXNodeType.AttributeIdentifier ? "attribute" : "style property"} name`,
      );
    }

    this.advance(name.length);

    const identifier = new DDUIXIdentifier(name, this.source(start));

    // @ts-expect-error "nodeType" will always be a type that expects an identifier
    return new DDUIXNode(nodeType, identifier);
  }

  parseNamespacedIdentifier<T extends NamespacedIdentifierNodeTypeUnion>(
    nodeType: T,
  ): DDUIXNodeUnion<T> {
    const start = this.position;

    const namespace = this.match(DDUIXRegExp.Identifier);
    if (!namespace) this.throw("Expected namespaced identifier");
    this.advance(namespace.length);

    if (!this.accept(DDUIXPunctuation.NamespaceSeparator)) {
      this.throw("Expected colon after namespace");
    }

    const name = this.match(DDUIXRegExp.Identifier);
    if (!name) this.throw("Expected identifier");
    this.advance(name.length);

    const identifier = new DDUIXNamespacedIdentifier(namespace, name, this.source(start));

    // @ts-expect-error "nodeType" will always be a type that expects a namespaced identifier
    return new DDUIXNode(nodeType, identifier);
  }
}
