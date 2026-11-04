import type { DDUIXNodeUnion } from "./node";
import type { DDUIXNodeType } from "./nodeType";

export class DDUIXTree {
  children: DDUIXNodeUnion[] = [];

  *getNodeIterator<T extends DDUIXNodeType>(...types: T[]) {
    for (const node of nodeIterator(this.children)) {
      if (types.length !== 0 && !types.includes(node.type as T)) continue;
      yield node as DDUIXNodeUnion<T>;
    }
  }

  getNodeAtOffset<T extends DDUIXNodeType>(offset: number, ...types: T[]) {
    return this.getNodesAtOffset(offset, ...types).at(-1);
  }

  getNodesAtOffset<T extends DDUIXNodeType>(offset: number, ...types: T[]) {
    const nodes: DDUIXNodeUnion<T>[] = [];

    for (const node of this.getNodeIterator(...types)) {
      if (offset > node.source.end.offset) continue;
      if (offset < node.source.start.offset) break;
      nodes.push(node);
    }

    return nodes;
  }
}

function* nodeIterator(nodes: DDUIXNodeUnion[]): Generator<DDUIXNodeUnion> {
  for (const node of nodes) {
    yield node;

    if (node.children) {
      yield* nodeIterator(node.children);
    }
  }
}

export * from "./node";
export * from "./nodeType";
