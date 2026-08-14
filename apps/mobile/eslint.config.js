const expoConfig = require("eslint-config-expo/flat");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "android/**",
      "ios/**",
      "dist-android/**",
      "dist-web/**",
      "public/canvaskit/**",
    ],
  },
]);
