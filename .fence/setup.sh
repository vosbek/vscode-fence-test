#!/usr/bin/env bash
# Installs what the fence's checks run. Written by the factory onboarding; edit it to match the repository.
set -euo pipefail
# --ignore-scripts: this repository's install scripts build native modules the fence does not need.
npm ci --ignore-scripts
