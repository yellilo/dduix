import type { DDUIXSource } from "../source";
import { DDUIXElement, DDUIXPlaceholderElement } from "./element";

export class DDUIXMarkup {
  constructor(
    /** An array containing the root elements of the markup. */
    public readonly body: DDUIXElement[],
    public readonly source: DDUIXSource,
  ) {}

  /** Creates a copy of the markup instance by cloning every element that the markup contains. */
  clone() {
    const body = this.body.map((child) => child.clone());
    return new DDUIXMarkup(body, this.source);
  }

  *[Symbol.iterator]() {
    yield* recursiveElementIterator(this.body);
  }

  /** Returns an array of all placeholder elements in the markup. */
  get placeholders() {
    const placeholders: DDUIXPlaceholderElement[] = [];

    for (const element of this) {
      if (element instanceof DDUIXPlaceholderElement) {
        placeholders.push(element);
      }
    }

    return placeholders;
  }
}

function* recursiveElementIterator(elements: readonly DDUIXElement[]): Generator<DDUIXElement> {
  for (const element of elements) {
    yield element;

    if (element.children) {
      yield* recursiveElementIterator(element.children);
    }
  }
}

export * from "./attribute";
export * from "./element";
