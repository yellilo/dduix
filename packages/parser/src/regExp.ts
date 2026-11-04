import { DDUIXPunctuation } from "@dduix/core";

export enum DDUIXRegExpAnchor {
  Start,
  End,
  StartToEnd,
}

export class DDUIXRegExp {
  static readonly StartAnchor = /^/;
  static readonly EndAnchor = /$/;

  static readonly Number = new RegExp(
    DDUIXPunctuation.Minus +
      "?(?:[0-9]+" +
      RegExp.escape(DDUIXPunctuation.DecimalPoint) +
      ")?[0-9]+",
  );

  static readonly HexDigit = /[0-9a-fA-F]/;

  static readonly Identifier = /[a-z][a-z0-9_]*/;

  static readonly Whitespace = /\s+/;
  static readonly NonWhitespace = /\S+/;

  static anchor(pattern: RegExp, to: DDUIXRegExpAnchor) {
    switch (to) {
      case DDUIXRegExpAnchor.Start:
        return DDUIXRegExp.concat(DDUIXRegExp.StartAnchor, pattern);
      case DDUIXRegExpAnchor.End:
        return DDUIXRegExp.concat(pattern, DDUIXRegExp.EndAnchor);
      case DDUIXRegExpAnchor.StartToEnd:
        return DDUIXRegExp.concat(DDUIXRegExp.StartAnchor, pattern, DDUIXRegExp.EndAnchor);
    }
  }

  static concat(...patterns: RegExp[]) {
    return new RegExp(patterns.reduce((joined, pattern) => joined + pattern.source, ""));
  }

  static match(string: string, pattern: RegExp, anchor?: DDUIXRegExpAnchor) {
    if (anchor !== undefined) {
      pattern = DDUIXRegExp.anchor(pattern, anchor);
    }

    return string.match(pattern);
  }
}
