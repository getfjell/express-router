import libraryConfig from "@fjell/eslint-config/library";

libraryConfig.ignores = [
  ...(libraryConfig.ignores || []),
  "examples/**"
];

export default libraryConfig;
