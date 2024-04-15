import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    languageOptions: { globals: globals.browser }
  },
  ...tseslint.configs.strict,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": ["off"],
      "@typescript-eslint/no-non-null-assertion": ["off"],
    }
  }
];
