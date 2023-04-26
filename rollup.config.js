import babelPlugin from "rollup-plugin-babel";
import typescript from "@rollup/plugin-typescript";
import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";
import resolve from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import stdLibBrowser from "node-stdlib-browser";
import json from "@rollup/plugin-json";
import externalGlobals from "rollup-plugin-external-globals";
import replace from "@rollup/plugin-replace";

const customResolver = resolve({
    extensions: [".mjs", ".js", ".jsx", ".json", ".sass", ".scss"],
});
export default {
    input: "./src/main.ts",
    output: [
        {
            file: "./dist/metaid.cjs.js",
            format: "umd",
            name: "metaidjs",
            sourcemap: true,
        },
        {
            file: "./dist/metaid.esm.js",
            format: "es",
            name: "metaidjs",
            sourcemap: true,
        },
        {
            file: "./dist/metaid.umd.js",
            format: "umd",
            name: "metaidjs",
            sourcemap: true,
        },
    ],
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
            ...stdLibBrowser,
        }),
        resolve({
            jsnext: true,
            main: true,
            brower: true,
        }),
        commonjs(),
        json(),
        replace({
            __env__: JSON.stringify(process.env.ENV),
            preventAssignment: true,
        }),
        babelPlugin({
            exclude: "node_modules/**",
            runtimeHelpers: true,
        }),
        typescript({
            tsconfig: "./tsconfig.json",
            rootDir: "./src",
            exclude: ["node_modules/**", "public/**"],
        }),

        globals(),
        //node环境下不需要
        externalGlobals({
            ["mvc-lib"]: "mvc",
            ["mvc-lib/ecies"]: "ECIES",
            ["mvc-lib/mnemonic"]: "Mnemonic",
            bip39: "bip39",
        }),
    ],
};
