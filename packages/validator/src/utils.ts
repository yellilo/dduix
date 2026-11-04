import { DDUIXValueType, DDUIXPlaceholderType, DDUIXMarkup } from "@dduix/core";

export function areValueTypesCompatible(expected: DDUIXValueType, provided: DDUIXValueType) {
  return (
    expected === provided ||
    (expected === DDUIXValueType.Float && provided === DDUIXValueType.Integer)
  );
}

export function markupHasPlaceholder(markup: DDUIXMarkup, type: DDUIXPlaceholderType) {
  return markup.placeholders.some((p) => p.type === type);
}
