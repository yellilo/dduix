import { DDUIXValueType, DDUIXPlaceholderType } from "../enums";
import { DDUIXKeywordMap } from "./keywordMap";

export class DDUIXKeywords {
  static readonly Boolean = new DDUIXKeywordMap<boolean>()
    .add("false", false)
    .add("true", true);

  static readonly PlaceholderType = new DDUIXKeywordMap<DDUIXPlaceholderType>()
    .add("children", DDUIXPlaceholderType.ComponentChildren)
    .add("target", DDUIXPlaceholderType.DecoratorTarget);

  static readonly ValueType = new DDUIXKeywordMap<DDUIXValueType>()
    .add("boolean", DDUIXValueType.Boolean)
    .add("float", DDUIXValueType.Float)
    .add("integer", DDUIXValueType.Integer)
    .add("object", DDUIXValueType.Object)
    .add("object[]", DDUIXValueType.ObjectArray)
    .add("string", DDUIXValueType.String);
}

export * from "./keywordMap";
