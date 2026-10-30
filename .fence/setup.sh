#!/usr/bin/env bash
# Installs what the fence's checks run. Written by the factory onboarding; edit it to match the repository.
set -euo pipefail
# --ignore-scripts: this repository's install scripts build native modules the fence does not need.
npm ci --ignore-scripts
# The browser check transpiles with build/next/build-fast.ts and runs VS Code's browser test runner in Chromium.
(cd build && npm ci --ignore-scripts)
npx playwright install chromium
