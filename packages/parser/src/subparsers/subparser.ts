import type { DDUIXSourcePosition } from "@dduix/core";
import type { DDUIXInternalParser } from "../parser";

export abstract class DDUIXInternalSubparser {
  get errors() {
    return this.parser.errors;
  }
  get position() {
    return this.parser.position;
  }
  get subparsers() {
    return this.parser.subparsers;
  }

  constructor(public parser: DDUIXInternalParser) {}

  //#region Utilities

  advance(length?: number) {
    return this.parser.advance(length);
  }

  skipWhitespace() {
    return this.parser.skipWhitespace();
  }

  expectWhitespace() {
    return this.parser.expectWhitespace();
  }

  peek(length?: number) {
    return this.parser.peek(length);
  }

  peekUntil(...matchers: (string | RegExp)[]) {
    return this.parser.peekUntil(...matchers);
  }

  peekUntilWhitespace() {
    return this.parser.peekUntilWhitespace();
  }

  pop(length?: number) {
    return this.parser.pop(length);
  }

  popUntil(...matchers: (string | RegExp)[]) {
    return this.parser.popUntil(...matchers);
  }

  match(regexp: RegExp) {
    return this.parser.match(regexp);
  }

  slice(length?: number) {
    return this.parser.slice(length);
  }

  startsWith(searchString: string) {
    return this.parser.startsWith(searchString);
  }

  accept(searchString: string) {
    return this.parser.accept(searchString);
  }

  expect(searchString: string) {
    return this.parser.expect(searchString);
  }

  skipPast(searchString: string) {
    return this.parser.skipPast(searchString);
  }

  throw(message: string, start?: DDUIXSourcePosition): never {
    return this.parser.throw(message, start);
  }

  source(start: DDUIXSourcePosition = this.position) {
    return this.parser.source(start);
  }

  //#endregion
}
