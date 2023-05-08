import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "rollup-plugin-typescript2";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import babel from "@rollup/plugin-babel";

export default {
  input: "./src/request-sdk.ts",
  output: {
    file: "./dist/request-sdk.min.js",
    format: "umd",
    name: "HttpRequest",
  },
  external: [],
  plugins: [
    builtins(),
    resolve({ mainFields: ["jsnext", "preferBuiltins"] }), //"browser"
    babel({
      babelHelpers: "runtime",
      exclude: "node_modules/**",
    }),
    /**\
     * {
      browser: true,
    }
     */
    commonjs(),
    json(),
    typescript(),
    globals(),
  ],
};
