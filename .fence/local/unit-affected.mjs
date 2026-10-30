#!/usr/bin/env node
// VS Code's unit tests for the files a change affects, without a full build. Written during factory onboarding
// for this repository; the fence passes it the affected test files (see "unit" in .fence/fence.json).
//
//   node .fence/local/unit-affected.mjs <test files...>
//
// Tests under test/common and test/node run here: tsc emits just those files and what they import (no type
// check, that is the "types" check's job), then mocha runs them with the tdd interface VS Code uses.
// Browser and Electron tests are listed, not run: VS Code's own CI runs them.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout.trim();
const files = process.argv.slice(2);
if (!files.length) {
  console.log("no affected unit tests");
  process.exit(0);
}
// Emitted next to the repository's own out/ (git-ignored as /out*/), so that FileAccess resolves
// "../extensions/..." and other repository-relative paths the way VS Code's test bootstrap does.
const dir = path.join(ROOT, ".cache", "fence", "unit");
const out = path.join(ROOT, "out-fence-unit");
rmSync(dir, { recursive: true, force: true });
rmSync(out, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const rel = (f) => path.relative(dir, path.join(ROOT, f)).split(path.sep).join("/");
writeFileSync(
  path.join(dir, "tsconfig.json"),
  `${JSON.stringify(
    {
      extends: rel("src/tsconfig.json"),
      compilerOptions: { outDir: path.relative(dir, out), rootDir: rel("src"), noEmit: false, noCheck: true, plugins: [], types: ["node", "mocha"] },
      files: files.map(rel),
      include: [rel("src/typings")],
    },
    null,
    2,
  )}\n`,
);
const tsc = spawnSync("npx", ["tsc", "-p", path.join(dir, "tsconfig.json")], { cwd: ROOT, encoding: "utf8" });
if (tsc.status !== 0) {
  console.log(`could not emit the tests:\n${tsc.stdout}${tsc.stderr}`);
  process.exit(1);
}
// The build copies a test's fixtures (JSON, text) next to its output; do the same for each test folder.
for (const d of new Set(files.map((f) => path.dirname(f)))) {
  cpSync(path.join(ROOT, d), path.join(out, path.relative("src", d)), { recursive: true, filter: (src) => !src.endsWith(".ts") });
}
const compiled = files.map((f) => path.join(out, path.relative("src", f)).replace(/\.ts$/, ".js"));
const setup = path.join(ROOT, ".fence", "local", "unit-setup.mjs");
const mochaBin = path.join(ROOT, "node_modules", "mocha", "bin", "mocha.js");
const mocha = spawnSync(process.execPath, ["--import", setup, mochaBin, "--ui", "tdd", "--reporter", "dot", ...compiled], {
  cwd: ROOT,
  encoding: "utf8",
  env: { ...process.env, FENCE_REPO_ROOT: ROOT, FENCE_UNIT_OUT: out },
});
process.stdout.write(`${files.length} affected test file${files.length === 1 ? "" : "s"}: ${files.join(", ")}\n${mocha.stdout}${mocha.stderr}`);
process.exit(mocha.status ?? 1);
