import { DDUIXIdentifier } from "./identifier";

interface Identifiable<I extends DDUIXIdentifier = DDUIXIdentifier> {
  identifier: I;
}
type IdentifierOf<T extends Identifiable> = T["identifier"];
type IdentifierMapKey<T extends Identifiable> = T | IdentifierOf<T>;

export class DDUIXIdentifierMap<T extends Identifiable> {
  #map = new Map<string, T>();

  constructor(values?: T[]) {
    values?.forEach((value) => this.add(value));
  }

  /**
   * @returns the number of elements in the map.
   */
  get size() {
    return this.#map.size;
  }

  /**
   * @returns an array of the elements in the map.
   */
  get values() {
    return this.#map.values().toArray();
  }

  /**
   * Removes all elements from the map.
   */
  clear() {
    this.#map.clear();
  }

  /**
   * @returns a boolean indicating whether an element with the specified key exists.
   */
  has(key: IdentifierMapKey<T>) {
    return this.#map.has(getMapKey(key));
  }

  /**
   * Adds a new element to the map, inferring the identifier from the object.
   * If an element with the same identifier already exists, the element will be updated.
   *
   * @returns the map that the value was added to.
   */
  add(value: T) {
    this.#map.set(value.identifier.toString(), value);
    return this;
  }

  /**
   * @returns the element associated with the specified identifier. If no element is associated with the specified identifier, undefined is returned.
   */
  get(identifier: IdentifierOf<T>) {
    return this.#map.get(identifier.toString());
  }

  /**
   * Removes the element associated with the specified identifier from the map.
   *
   * @returns true if an element in the map existed and has been removed, or false if the element does not exist.
   */
  remove(key: IdentifierMapKey<T>) {
    return this.#map.delete(getMapKey(key));
  }

  clone() {
    return new DDUIXIdentifierMap(this.values);
  }

  toJSON() {
    return this.values;
  }

  [Symbol.iterator]() {
    return this.#map.values();
  }
}

function getMapKey<T extends Identifiable>(key: T | IdentifierOf<T>) {
  const identifier = key instanceof DDUIXIdentifier ? key : key.identifier;
  return identifier.toString();
}
