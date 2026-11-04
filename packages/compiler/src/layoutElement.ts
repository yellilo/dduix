import {
  DDUIXDataStoreReference,
  DDUIXElementAttribute,
  DDUIXIdentifierMap,
  DDUIXValue,
} from "@dduix/core";
import type { DDUIXNativeComponentDefinition } from "@dduix/native";

export interface DDUIXLayoutElementAttribute extends DDUIXElementAttribute {
  value: DDUIXValue | DDUIXDataStoreReference;
}

export type DDUIXLayoutElementAttributes = DDUIXIdentifierMap<DDUIXLayoutElementAttribute>;

export class DDUIXLayoutElement {
  constructor(
    public component: DDUIXNativeComponentDefinition,
    public attributes: DDUIXLayoutElementAttributes,
    public children?: DDUIXLayoutElement[],
  ) {}
}
