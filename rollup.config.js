import babelPlugin from "rollup-plugin-babel";
import typescript from "@rollup/plugin-typescript";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import resolve from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
const customResolver = resolve({
    extensions: [".mjs", ".js", ".jsx", ".json", ".sass", ".scss"],
});
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
        alias({
            entries: [
                {
                    find: "@",
                    replacement: "./src",
                },
            ],
            customResolver,
        }),
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
