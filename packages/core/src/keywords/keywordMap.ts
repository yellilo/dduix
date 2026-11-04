export class DDUIXKeywordMap<T extends boolean | number | string> {
  readonly #keywordToValue = new Map<string, T>();
  readonly #valueToKeyword = new Map<T, string>();

  get keywords() {
    return this.#keywordToValue.keys().toArray();
  }
  get values() {
    return this.#keywordToValue.values().toArray();
  }

  add(keyword: string, value: T): this {
    if (this.hasKeyword(keyword)) {
      throw new Error(`Keyword "${keyword}" is already defined`);
    }
    if (this.hasValue(value)) {
      throw new Error(`Value ${value} is already associated with a keyword`);
    }

    this.#keywordToValue.set(keyword, value);
    this.#valueToKeyword.set(value, keyword);

    return this;
  }

  hasKeyword(keyword: string) {
    return this.#keywordToValue.has(keyword);
  }
  hasValue(value: T) {
    return this.#valueToKeyword.has(value);
  }

  getKeyword(value: T) {
    return this.#valueToKeyword.get(value);
  }
  getValue(keyword: string) {
    return this.#keywordToValue.get(keyword);
  }
}
