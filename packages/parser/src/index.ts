import { DDUIXDefinitions, DDUIXError } from "@dduix/core";
import { DDUIXInternalParser } from "./parser";

export class DDUIXParser {
  #parser = new DDUIXInternalParser();

  readonly definitions: DDUIXDefinitions = this.#parser.definitions;

  get errors(): readonly DDUIXError[] {
    return Object.freeze([...this.#parser.errors]);
  }

  parse(code: string, file?: string) {
    this.#parser.parse(code, file);
  }

  getTree(file: string) {
    return this.#parser.trees.get(file);
  }
}

/** Shorthand for creating a new DDUIXParser and calling parse() for a single file */
export function parse(code: string, file?: string) {
  const parser = new DDUIXParser();
  parser.parse(code, file);
  return parser.definitions;
}

export * from "./regExp";
export * from "./tree";
