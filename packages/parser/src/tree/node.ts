import type { DDUIXSource } from "@dduix/core";
import type { DDUIXNodeType, DDUIXNodeTypeDataMap } from "./nodeType";

export type DDUIXNodeUnion<T extends DDUIXNodeType = DDUIXNodeType> = T extends DDUIXNodeType
  ? DDUIXNode<T>
  : never;

export class DDUIXNode<T extends DDUIXNodeType = DDUIXNodeType> {
  source: DDUIXSource;
  parent: DDUIXNodeUnion | undefined;
  children: DDUIXNodeUnion[] | undefined;

  constructor(type: T, data: DDUIXNodeTypeDataMap[T], source: DDUIXSource);
  constructor(type: T, data: Extract<DDUIXNodeTypeDataMap[T], { source: DDUIXSource }>);
  constructor(
    public type: T,
    public data: DDUIXNodeTypeDataMap[T],
    source?: DDUIXSource,
  ) {
    // @ts-expect-error One of these will be defined
    this.source = source ?? data.source;
  }

  addChild(node: DDUIXNodeUnion) {
    this.children ??= [];
    this.children.push(node);
    node.parent = this as DDUIXNodeUnion;
  }

  addChildren(nodes: DDUIXNodeUnion[]) {
    nodes.forEach(n => this.addChild(n));
  }

  *getAncestorIterator<T extends DDUIXNodeType>(...types: T[]) {
    for (let ancestor = this.parent; ancestor !== undefined; ancestor = ancestor.parent) {
      if (types.includes(ancestor.type as T)) {
        yield ancestor as DDUIXNodeUnion<T> | undefined;
      }
    }
  }

  getAncestor<T extends DDUIXNodeType>(...types: T[]) {
    return this.getAncestorIterator(...types).next().value ?? undefined;
  }
}
