import { DDUIXIdentifier } from "./identifier";

export class DDUIXIdentifierSet<T extends DDUIXIdentifier> {
  #map = new Map<string, T>();

  constructor(values?: T[]) {
    values?.forEach(value => this.add(value));
  }

  get size() {
    return this.#map.size;
  }

  clear() {
    this.#map.clear();
  }

  has(value: T) {
    return this.#map.has(value.toString());
  }

  add(value: T) {
    this.#map.set(value.toString(), value);
    return this;
  }

  delete(value: T) {
    this.#map.delete(value.toString());
  }

  toJSON() {
    return this.#map.values().toArray();
  }

  [Symbol.iterator]() {
    return this.#map.values();
  }
}
