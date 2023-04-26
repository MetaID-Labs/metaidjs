// import path from "path";
// import { fileURLToPath } from "url";
import serve from "rollup-plugin-serve";
import rootConfig from "./rollup.config.js";
import livereload from "rollup-plugin-livereload";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const resolveFile = function (filePath) {
//     return path.resolve(__dirname, "..", filePath);
// };

export default function config() {
    rootConfig.output.sourcemap = true;
    rootConfig.plugins = [
        ...rootConfig.plugins,
        ...[
            serve({
                port: 10001,
                contentBase: "dist",
            }),
            livereload(), // 启动重载，并且监听dist目录
        ],
    ];

    return rootConfig;
}
