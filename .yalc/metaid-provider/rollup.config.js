import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "rollup-plugin-typescript2";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import babel from "@rollup/plugin-babel";

export default {
  input: "./src/index.ts",
  output: {
    file: "./dist/metaid-provider-sdk.min.js",
    format: "umd",
    name: "MetaIdProviderSDK",
    globals: {
      mvc: "mvc-lib",
    },
  },
  external: ["mvc-lib"],
  plugins: [
    builtins(),
    resolve({ mainFields: ["jsnext", "preferBuiltins", "browser"] }),
    babel({
      babelHelpers: "runtime",
      exclude: "node_modules/**",
    }),
    commonjs({
      browser: true,
    }),
    json(),
    typescript(),
    globals(),
  ],
};
