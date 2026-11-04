import type { DDUIXDefinitions, DDUIXError } from "@dduix/core";
import type { DDUIXValidatorOptions } from "./options";
import { DDUIXInternalValidator } from "./validator";

export class DDUIXValidator {
  #validator: DDUIXInternalValidator;

  readonly errors: DDUIXError[];

  constructor(options?: DDUIXValidatorOptions) {
    this.#validator = new DDUIXInternalValidator(options);
    this.errors = this.#validator.errors;
  }

  validate(definitions: DDUIXDefinitions) {
    this.#validator.validate(definitions);
  }
}

export type { DDUIXValidatorOptions };
