import eslint from "@eslint/js";
import { globalIgnores } from "eslint/config";
import * as importPlugin from "eslint-plugin-import";
import noOnlyTests from "eslint-plugin-no-only-tests";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  [
    globalIgnores([
      "**/node_modules/",
      "**/dist/",
      "**/coverage/",
      "**/.yarn/",
    ]),
    {
      files: ["**/*.{js,mjs,ts}"],
      plugins: {
        import: importPlugin,
        "no-only-tests": noOnlyTests,
      },
      languageOptions: {
        ecmaVersion: 2020,
        globals: {
          ...globals.node,
        },
      },
      rules: {
        "prettier/prettier": "warn",
        "no-only-tests/no-only-tests": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-function-type": "warn",
        "@typescript-eslint/ban-ts-comment": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            varsIgnorePattern: "^_",
            argsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
            destructuredArrayIgnorePattern: "^_",
          },
        ],
        "import/order": [
          "warn",
          {
            alphabetize: { order: "asc" },
            groups: [
              "builtin",
              "external",
              ["internal", "parent", "sibling", "index"],
            ],
            "newlines-between": "always",
            distinctGroup: true,
            pathGroupsExcludedImportTypes: ["builtin"],
          },
        ],
        "no-multiple-empty-lines": "warn",
      },
    },
  ],
);
