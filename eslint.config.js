import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";

export default defineConfig({
  files: ["**/*.{js,ts}"],
  ignores: ["**/dist/**"],
  languageOptions: { globals: globals.node },
  extends: [js.configs.recommended, tseslint.configs.recommended],
});
