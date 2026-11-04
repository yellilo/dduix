import {
  DDUIXDefinitions,
  DDUIXError,
  DDUIXSource,
  DDUIXSourcePosition,
  DDUIXSyntaxError,
} from "@dduix/core";

import { DDUIXRegExp, DDUIXRegExpAnchor } from "./regExp";
import { DDUIXInternalSubparsers } from "./subparsers";
import { DDUIXTree } from "./tree";

export class DDUIXInternalParser {
  readonly subparsers = new DDUIXInternalSubparsers(this);
  readonly definitions = new DDUIXDefinitions();
  readonly trees = new Map<string, DDUIXTree>();

  errors: DDUIXError[] = [];

  /** Path to the file currently being parsed. */
  file = "";
  /** DDUIX file content currently being parsed. */
  input = "";

  #position: DDUIXSourcePosition = new DDUIXSourcePosition(0, 0, 0);

  /** Returns the current character position of the parser. */
  get position() {
    return new DDUIXSourcePosition(
      this.#position.offset,
      this.#position.line,
      this.#position.character,
    );
  }

  //#region Definitions

  parse(code: string, file: string = "") {
    if (file) this.errors = this.errors.filter(error => error.source.file !== file);
    if (file) this.definitions.removeFile(file);
    if (file) this.trees.delete(file);

    this.file = file;
    this.input = code;
    this.#position = new DDUIXSourcePosition(0, 0, 0);

    try {
      this.parseFile();
    } catch (e) {
      if (e instanceof DDUIXError) this.errors.push(e);
      else throw e;
    }
  }

  parseFile() {
    this.skipWhitespace();
    const tree = new DDUIXTree();
    if (this.file) this.trees.set(this.file, tree);

    while (this.position.offset < this.input.length) {
      const definitionNode = this.subparsers.definition.parse();

      try {
        tree.children.push(definitionNode);
        this.definitions.add(definitionNode.data);
      } catch (e) {
        if (e instanceof DDUIXError) this.errors.push(e);
        else throw e;
      }

      this.skipWhitespace();
    }
  }

  //#region Utilities

  advance(length: number = 1) {
    const end = Math.min(this.#position.offset + length, this.input.length);

    while (this.#position.offset < end) {
      const char = this.peek();

      this.#position.offset++;
      this.#position.character++;

      if (char === "\n") {
        this.#position.line++;
        this.#position.character = 0;
      }
    }
  }

  skipWhitespace() {
    const name = this.match(DDUIXRegExp.Whitespace);
    if (!name) return false;

    this.advance(name.length);
    return true;
  }

  expectWhitespace() {
    if (this.skipWhitespace()) return;

    this.throw("Expected whitespace");
  }

  peek(length = 1) {
    return this.slice(length);
  }

  peekUntil(...matchers: (string | RegExp)[]) {
    const peeked = this.slice();
    let end = peeked.length;

    for (const matcher of matchers) {
      let index: number;

      if (typeof matcher === "string") {
        index = peeked.indexOf(matcher);
      } else {
        const match = peeked.match(matcher);
        index = match?.index ?? -1;
      }

      if (index !== -1 && index < end) {
        end = index;
      }
    }

    return peeked.slice(0, end);
  }

  peekUntilWhitespace() {
    return this.match(DDUIXRegExp.NonWhitespace) ?? "";
  }

  pop(length = 1) {
    const substring = this.peek(length);
    this.advance(length);

    if (substring.length < length) {
      this.throw("Unexpected end of file");
    }

    return substring;
  }

  popUntil(...matchers: (string | RegExp)[]) {
    const substring = this.peekUntil(...matchers);
    this.advance(substring.length);

    return substring;
  }

  match(regexp: RegExp) {
    return DDUIXRegExp.match(this.slice(), regexp, DDUIXRegExpAnchor.Start)?.[0];
  }

  slice(length?: number) {
    const { offset } = this.#position;

    if (length === undefined) return this.input.slice(offset);
    else return this.input.slice(offset, offset + length);
  }

  startsWith(searchString: string) {
    return this.input.startsWith(searchString, this.#position.offset);
  }

  /**
   * If `searchString` is found directly after the current `position`, skip to after the string and return true.
   *
   * Otherwise, return false and do not update `position`.
   */
  accept(searchString: string) {
    if (this.startsWith(searchString)) {
      this.advance(searchString.length);
      return true;
    }

    return false;
  }

  /**
   * If `searchString` is found directly after the current `position`, skip to after the string.
   *
   * Otherwise, throw an error.
   */
  expect(searchString: string) {
    if (this.accept(searchString)) return;

    this.throw(`Expected "${searchString}"`);
  }

  skipPast(searchString: string) {
    const index = this.slice().indexOf(searchString);
    if (index === -1) return false;

    this.advance(index + searchString.length);
    return true;
  }

  throw(message: string, start?: DDUIXSourcePosition): never {
    throw new DDUIXSyntaxError(message, this.source(start));
  }

  source(start: DDUIXSourcePosition = this.position) {
    const end = this.position;
    if (end.offset === start.offset) {
      end.offset++;
      end.character++;
    }

    return new DDUIXSource(this.file, start, end);
  }

  //#endregion
}
