import babelPlugin from "rollup-plugin-babel";
import typescript from "@rollup/plugin-typescript";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
export default {
    input: "./src/main.ts",
    output: {
        file: "./dist/metaid.js",
        format: "umd",
        name: "metaidjs",
        sourcemap: true,
    },
    plugins: [
        builtins(),
        resolve({
            jsnext: true,
            main: true,
            brower: true,
        }),
        commonjs(),
        json(),
        babelPlugin({
            exclude: "node_modules/**",
            runtimeHelpers: true,
        }),
        typescript({
            tsconfig: "./tsconfig.json",
        }),

        globals(),
    ],
};
