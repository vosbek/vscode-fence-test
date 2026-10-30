#!/usr/bin/env node
// VS Code's browser unit tests for the files a change affects, run by VS Code's own runner in Chromium.
// Written during factory onboarding for this repository; the fence passes it the affected test files
// (see "browser" in .fence/fence.json).
//
//   node .fence/local/browser-affected.mjs <test files...>
//
// Transpiles the client with VS Code's build-fast (no type check, the "types" check does that), then runs
// test/unit/browser/index.js --browser chromium --run <file> for each. Electron-only tests stay with VS Code's CI.
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout.trim();
const files = process.argv.slice(2).filter((f) => f.endsWith(".test.ts"));
if (!files.length) {
  console.log("no affected browser tests");
  process.exit(0);
}
const run = (args, label) => {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) {
    process.stdout.write(`${label} failed:\n${(r.stdout + r.stderr).split("\n").slice(-40).join("\n")}\n`);
    process.exit(r.status ?? 1);
  }
  return r.stdout;
};
run([path.join(ROOT, "build", "next", "build-fast.ts"), "--client-only"], "build-fast");
const out = run([path.join(ROOT, "test", "unit", "browser", "index.js"), "--browser", "chromium", ...files.flatMap((f) => ["--run", f])], "browser tests");
const summary = out.split("\n").filter((l) => /passing|failing|pending/.test(l)).join("\n");
process.stdout.write(`${files.length} affected browser test file${files.length === 1 ? "" : "s"}: ${files.join(", ")}\n${summary}\n`);
