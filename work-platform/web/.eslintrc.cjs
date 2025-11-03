module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react"],
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: [".next/**", "node_modules/**", "coverage/**"],
  rules: {
    "react/jsx-key": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-restricted-imports": ["error", {
      "patterns": ["@/components/_deprecated/*"]
    }],
  },
};
