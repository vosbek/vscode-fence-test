# Static demo: VS Code, mapped

A read-only copy of the software factory's views for this fork, built from the `factory/onboard` branch:

- `index.html`: start here
- `map/`: the codebase map as an expandable C4 diagram (Cartographer viewer); `map/#/guard` lists every guardrail: rules in force, proposed rules and fence checks
- `rules/`: the rules page (every guard rule, fence check, exception and owner)
- `c4/`: the C4 diagrams from `/explain-repo`

Nothing here runs code on a server. Asking questions on the map needs a clone and `python3 .cartographer/bin/ask.py`.
To rebuild: in a checkout of `factory/onboard`, run `collect.py`, `graph.py` and `build.py` (copy `.cartographer/dist/cartograph.html` to `map/index.html`), `rules_app.py export rules/index.html` and `c4.py --from-map .cartographer/model/model.json -o c4/index.html`.
