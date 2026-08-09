# HANDOFF

Updated: 2026-08-10 by Codex
Task: m5-connected-level

## Status

M5.1 PASS. M5.2 PASS. M5.3 PASS. M5.4-M5.6 have not started.

## M5.1

- Six-zone immutable `MOURNEVEIL_CONNECTED_LEVEL` with stable entry, encounter/checkpoint references, and six open/gated/shortcut connections.
- `ConnectedWorldRuntime` owns current-zone projection, opened shortcut IDs, and final-gate reach without duplicating encounter/checkpoint state.
- SaveFileV2 stores stable world flags; V1 migrates explicitly with closed/default world state; local storage reads the legacy V1 key and writes V2.
- Gate: lint, typecheck, 9 focused world/save tests, and diff check PASS.

## M5.2

- Canonical checkpoint: `checkpoint.m5.refuge` at `(-6, 0.82, 0)`; legacy active checkpoint IDs restore into it.
- F emits one semantic world-interaction edge. Near refuge it activates/rests/refills; at the mixed-side shortcut control it opens `connection.shortcut-checkpoint-mixed` once.
- Three encounters place four runtimes from the two accepted enemy definitions: introduction skirmisher, mixed skirmisher+brute, pressure skirmisher.
- Death/respawn and checkpoint rest recreate enemies/contact/action state, preserve shortcut state and multi-source loot memory, and do not grant Echoes during reset.
- Final gate state becomes persistent only after all encounters are complete and the player reaches its authored boundary.
- Gate: 26 focused tests, full 45-file/183-test M1-M4 suite, lint, typecheck, and diff check PASS.
- Browser: unavailable. Playwright Chromium executable is not installed; in-app browser discovery returned no instances. The M5.2 route-state gate script is committed but could not launch.

## M5.3

- New/default sessions start at `zone.arrival`; activated saves restore at the canonical refuge checkpoint. Load resets transient encounter/contact/action state.
- Runtime layout is a 34×19 fixed-Rapier graybox with perimeter walls, a northern arrival choke, an open first-fight/refuge space, a southern long route into the mixed court, a far-side shortcut, sparse navigation-safe blockers, final approach, and final arena gate.
- Shortcut/final gate collider presence projects the simulation-owned world flags. No render state authors progression.
- Existing enemy definitions populate open spaces compatible with direct pursuit and 45-degree local steering. No navmesh, teleport correction, or new enemy role was added.
- Echo deaths use the collision-resolved player position; legacy/debug positions outside authored zone interiors clamp deterministically to the nearest safe zone interior. Loot/inventory/equipment and V2 world/recovery state reload coherently.
- Gate: 23 focused runtime/world/save tests including real Rapier long-route, closed/open gate, and perimeter proof; full 48-file/190-test suite, lint, typecheck, build, verify, and diff check PASS.
- Browser: mandatory only when controllable; unavailable here. Project Playwright lacks its Chromium executable and in-app browser discovery returned `[]`, so entry-to-gate visual playthrough, camera observation, reload observation, and console inspection remain manual.

## Known constraints

- Navigation remains direct pursuit with local steering; layout intentionally avoids mazes and tight multi-turn routing.
- Primitive zones overlap visually at connection seams and await M5.4 readability/composition work.
- Production bundle still emits the pre-existing >500 kB advisory.

## Locked scope

- Execute M5.1 → M5.2 → M5.3 sequentially with internal gates.
- Work directly on clean `main`; no branch, push, controller work, production art, boss, or M5.4 work.
- Preserve accepted M1-M4 authority contracts.

## Next action

Commit M5.3. Next: Cursor M5.4 level readability/environmental composition, then M5.5 tuning and M5.6 full browser playthrough/verification.
