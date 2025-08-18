module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {
    "no-undef": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "no-restricted-globals": "off",
    "react-hooks/rules-of-hooks": "off",
    "no-case-declarations": "off",
  },
  globals: {
    describe: "readonly",
    test: "readonly",
    expect: "readonly",
    jest: "readonly",
  },
};
