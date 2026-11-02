// The globals VS Code's own Node test bootstrap sets (test/unit/node/index.js), for tests the fence runs
// without a full build. Loaded by unit-affected.mjs through mocha's --import.
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.env.FENCE_REPO_ROOT;
const out = process.env.FENCE_UNIT_OUT;
const require = createRequire(import.meta.url);
globalThis._VSCODE_PRODUCT_JSON = require(path.join(root, "product.json"));
globalThis._VSCODE_PACKAGE_JSON = require(path.join(root, "package.json"));
globalThis._VSCODE_FILE_ROOT = pathToFileURL(out).href;
Object.assign(globalThis, {
  __readFileInTests: (p) => fs.readFile(p, "utf-8"),
  __writeFileInTests: (p, contents) => fs.writeFile(p, contents),
  __readDirInTests: (p) => fs.readdir(p),
  __unlinkInTests: (p) => fs.unlink(p),
  __mkdirPInTests: (p) => fs.mkdir(p, { recursive: true }),
});
