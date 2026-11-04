export interface DDUIXValidatorOptions {
  reservedNamespaces?: string[];
}

const defaultOptions = {
  reservedNamespaces: ["minecraft", "dduix"],
} satisfies DDUIXValidatorOptions;

export type ResolvedOptions = DDUIXValidatorOptions & typeof defaultOptions;

export function resolveOptions(options: DDUIXValidatorOptions = {}) {
  const resolved = { ...options };

  for (const entry of Object.entries(defaultOptions)) {
    const key = entry[0] as keyof DDUIXValidatorOptions;
    resolved[key] ??= defaultOptions[key];
  }

  return resolved as ResolvedOptions;
}
