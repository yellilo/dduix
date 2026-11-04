export enum DDUIXPunctuation {
  At = "@",
  Bar = "|",
  Colon = ":",
  Comma = ",",
  Dot = ".",
  Equals = "=",
  Exclamation = "!",
  Hash = "#",
  Minus = "-",
  Semicolon = ";",
  Question = "?",

  Assignment = Equals,
  ColorPrefix = Hash,
  DecimalPoint = Dot,
  EnumSeparator = Bar,
  Negation = Exclamation,
  Nullable = Question,
  RangeSeparator = Dot + Dot,
  StylePropertyDelimeter = Semicolon,

  // Slashes
  Slash = "/",
  BackSlash = "\\",

  // Brackets
  LeftAngleBracket = "<",
  RightAngleBracket = ">",
  AngleBrackets = LeftAngleBracket + RightAngleBracket,

  LeftCurlyBracket = "{",
  RightCurlyBracket = "}",
  CurlyBrackets = LeftCurlyBracket + RightCurlyBracket,

  LeftRoundBracket = "(",
  RightRoundBracket = ")",
  RoundBrackets = LeftRoundBracket + RightRoundBracket,

  LeftSquareBracket = "[",
  RightSquareBracket = "]",
  SquareBrackets = LeftSquareBracket + RightSquareBracket,

  // Identifiers
  NamespaceSeparator = Colon,

  // Markup
  ElementStartTagOpen = LeftAngleBracket,
  ElementStartTagClose = RightAngleBracket,
  ElementStartTagSelfClose = Slash + RightAngleBracket,

  ElementEndTagOpen = LeftAngleBracket + Slash,
  ElementEndTagClose = RightAngleBracket,

  ElementDecoratorPrefix = At,

  // Strings
  DoubleQuote = '"',
  SingleQuote = "'",
  Quotes = DoubleQuote + SingleQuote,

  StringEscape = BackSlash,

  // Scopes
  ConstraintDomainOpen = LeftAngleBracket,
  ConstraintDomainClose = RightAngleBracket,

  ReferenceOpen = LeftCurlyBracket,
  ReferenceClose = RightCurlyBracket,

  MarkupOpen = LeftCurlyBracket,
  MarkupClose = RightCurlyBracket,

  AttributeDefinitionsOpen = LeftRoundBracket,
  AttributeDefinitionsClose = RightRoundBracket,

  StyleDeclarationListOpen = LeftCurlyBracket,
  StyleDeclarationListClose = RightCurlyBracket,

  StyleDeclarationOpen = LeftCurlyBracket,
  StyleDeclarationClose = RightCurlyBracket,
}
