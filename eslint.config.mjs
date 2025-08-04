import libraryConfig from "@fjell/eslint-config/library";

export default [
  {
    ignores: ["examples/**", "src/util/general.ts"]
  },
  ...libraryConfig,
  {
    // Additional rules for examples if they are processed
    files: ["examples/**/*.ts", "examples/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
];
