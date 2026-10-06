/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: "latest",
  },
  extends: [
    "plugin:vue/vue3-recommended",
    "eslint:recommended",
    "@vue/eslint-config-typescript/recommended",
    "@vue/eslint-config-prettier",
  ],
  rules: {
    "no-unused-vars": "off",
    "vue/multi-word-component-names": "off",
  },
  overrides: [
    {
      files: ["**/*.vue", "**/*.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
        // ponytail: template ships UI-only typing (`: any`); real types land via openapi-typescript in stage 2+. Re-enable when the last defaults.ts consumer is gone.
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};