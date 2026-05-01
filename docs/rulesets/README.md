# Branch protection rulesets

Two pre-built rulesets for the `main` branch. Upload via:

> **GitHub UI:** Repo → Settings → Rules → Rulesets → "New ruleset" dropdown → "Import a ruleset" → upload the `.json` file.

The ruleset gets applied to the default branch (`main`) immediately on save. Edit / delete / disable from the same UI later if needed.

---

## Recommended now: `main-light.json`

**What it does:**
- ❌ No force-push (`non_fast_forward`)
- ❌ No deletion (`deletion`)
- ✅ Direct push to `main` still allowed
- ✅ CI / CodeQL / Lighthouse still run on every push (just not enforced)

**Why this one for now:** the v2 buildout is moving fast — direct-push velocity matters more than gating every change behind a PR while you and Merric are iterating. Force-push and deletion are the two truly-destructive operations; the light ruleset blocks both without slowing iteration.

---

## When to upgrade: `main-strict.json`

**What it adds on top of light:**
- ✅ PR required for every change (no direct push to `main`)
- ✅ Required status checks: `Lint, type-check, build` + `Analyze (javascript-typescript)` + `Lighthouse audit` must pass before merge
- ✅ Strict mode: PR branch must be up-to-date with `main` before merging
- ✅ Stale reviews dismissed when new commits are pushed
- ✅ Allowed merge methods: squash + rebase only (no merge commits)
- ✅ Repo admins can bypass in emergencies (`actor_id: 5` = admin role)

**Why upgrade later:** per CLAUDE.md §5.2 — "branch protection on `main` — when project matures, require PR review even for the owner." The strict ruleset is the v1.5+ posture: every change reviewed (by CI, since `required_approving_review_count: 0` skips human review for solo dev), nothing reaches `main` that didn't pass the gate. Tradeoff: ~30-60s of PR-roundtrip friction per change.

To swap: delete the existing "Protect main (light)" ruleset, then upload `main-strict.json` the same way.

---

## What's NOT in either ruleset

- **Required code-owner review** — no `CODEOWNERS` file exists yet, so this would do nothing.
- **Signed commits** — possible to require, but breaks the "Co-Authored-By trailer" convention (those don't carry signatures).
- **Linear history** — not enforced; squash/rebase merge methods naturally produce linear history without a separate rule.
- **Block creations** — would prevent `gh-pages` and any future branch from being made; too strict.

If any of these become important, edit the ruleset in the UI or PR a JSON update against this directory.

---

## Field reference

The JSON schema is documented at:
- https://docs.github.com/en/rest/repos/rules — Rulesets API
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets

Key fields used in our files:
- `target: "branch"` — applies to a branch (vs `tag`)
- `conditions.ref_name.include: ["~DEFAULT_BRANCH"]` — special token for "the default branch (main)"
- `enforcement: "active"` — vs `evaluate` (dry-run, logs but doesn't block)
- `bypass_actors[].actor_id: 5` — repo admin role
- `rules[].type: "required_status_checks".parameters.required_status_checks[].context` — the EXACT name of the check job (`name:` field in the workflow YAML)

If we ever rename a workflow job (e.g. `name: 'Lint, type-check, build'` in `ci.yml`), we have to update the corresponding `context` in the strict ruleset or required checks will fail to match.
