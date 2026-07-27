# Vertical Slice Contract

## Success condition

A new user can launch the local production build, complete the slice from entry to boss reward, die and recover correctly, restart the application without losing valid progress, and understand the combat without developer intervention.

## Required playable flow

1. Launch
2. Enter the first area
3. Learn movement and camera
4. Fight a low-pressure enemy
5. Reach a checkpoint
6. Fight a mixed encounter
7. Acquire or equip one meaningful reward
8. Open a shortcut
9. Fight an elite
10. Enter the boss arena
11. Defeat the boss
12. Receive a completion reward
13. Save and reload the completed state

## Quality gates

- Core outcomes are independent of frame rate within supported ranges.
- Combat actions use explicit state and timing.
- Enemy telegraphs are readable.
- Input does not remain stuck after focus loss.
- Save data has a version and validation.
- Missing optional art does not destroy semantic UI.
- Debug fixtures reproduce critical states.
- The local production build is the acceptance target, not only the dev server.
- Product Owner playthrough is required for acceptance.

## Deferred after the slice

- Additional classes
- Additional regions
- Advanced equipment affixes
- Narrative systems beyond the slice
- Deployment and public hosting
