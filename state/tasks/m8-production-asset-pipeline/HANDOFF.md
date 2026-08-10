# HANDOFF

Updated: 2026-08-11 by Codex
Task: m8-production-asset-pipeline

## Status

**ACTIVE — macro-batch 1, baseline gate passed.** M8 remains open; M9 not started.

## Repository truth

- Clean `main` began at `c93f083`; annotated tag `v0.7.0-animation-foundation` peels to that commit.
- `origin/main` matched HEAD at start. Remote tag inspection was unavailable because outbound network access was blocked.
- Product Owner acceptance closed the historical M7 HANDOFF; no history or tag was changed.

## Baseline correction

- Root cause: one `respawnPosition` simultaneously authored checkpoint respawn, interaction, and the procedural shrine pivot, placing the player at the shrine center.
- The checkpoint definition now owns distinct immutable visual, interaction, and respawn anchors plus an explicit collision-proxy size.
- World physics owns the fixed checkpoint proxy; render does not derive collision from asset geometry.
- The checkpoint navigation anchor uses the safe interaction side. HUD and runtime proximity checks use the interaction anchor.
- Gate: lint/typecheck and 17 focused tests passed. In-app browser discovery returned no available browser, so runtime visual observation remains pending.

## Next

Establish the narrow asset contract/validator, then load the checkpoint shrine through it. Do not expand into character assets, broad environment art, M9, controller, or remote delivery.
