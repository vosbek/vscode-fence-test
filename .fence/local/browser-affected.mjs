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
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout.trim();
const files = process.argv.slice(2).filter((f) => f.endsWith(".test.ts"));
if (!files.length) {
  console.log("no affected browser tests");
  process.exit(0);
}
// Per-test results: VS Code's runner writes JUnit (mocha-junit-reporter) when given --tfs, into
// $BUILD_ARTIFACTSTAGINGDIRECTORY/test-results/. They are joined into the file the fence names in "results".
const RESULTS = path.join(ROOT, ".cache", "fence", "results", "browser.xml");
const STAGING = path.join(ROOT, ".cache", "fence", "browser-junit");
rmSync(STAGING, { recursive: true, force: true });
mkdirSync(path.dirname(RESULTS), { recursive: true });
const run = (args, label) => {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, env: { ...process.env, BUILD_ARTIFACTSTAGINGDIRECTORY: STAGING } });
  if (r.status !== 0) {
    process.stdout.write(`${label} failed:\n${(r.stdout + r.stderr).split("\n").slice(-40).join("\n")}\n`);
    process.exit(r.status ?? 1);
  }
  return r.stdout;
};
run([path.join(ROOT, "build", "next", "build-fast.ts"), "--client-only"], "build-fast");
const writeResults = () => {
  let dir = [];
  try {
    dir = readdirSync(path.join(STAGING, "test-results")).filter((f) => f.endsWith(".xml"));
  } catch {}
  const body = dir.map((f) => readFileSync(path.join(STAGING, "test-results", f), "utf8").replace(/<\?xml[^>]*\?>/, "")).join("\n");
  writeFileSync(RESULTS, `<?xml version="1.0" encoding="UTF-8"?>\n<results>\n${body}\n</results>\n`);
};
process.on("exit", writeResults);
const out = run([path.join(ROOT, "test", "unit", "browser", "index.js"), "--browser", "chromium", "--tfs", "fence", ...files.flatMap((f) => ["--run", f])], "browser tests");
const summary = out.split("\n").filter((l) => /passing|failing|pending/.test(l)).join("\n");
process.stdout.write(`${files.length} affected browser test file${files.length === 1 ? "" : "s"}: ${files.join(", ")}\n${summary}\n`);
