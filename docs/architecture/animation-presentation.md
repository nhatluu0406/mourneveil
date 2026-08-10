# Animation Presentation Boundary

M7 animation is a projection of authoritative fixed-step state:

```text
GameRuntime snapshot
  -> AnimationPresentationState
  -> procedural pose renderer (M7)
  -> in-place skinned GLTF / AnimationMixer renderer (future M8)
```

`AnimationPresentationState` is backend-neutral: it exposes actor mode, velocity-derived locomotion, authoritative facing, committed action identity/phase/progress, cosmetic hit token, and transition hints. Procedural and future clip backends consume the same state.

Gameplay owns transforms, action phases, contacts, damage, dodge invulnerability, and defeat. Root motion is disabled by policy. Clip events may request presentation-only footsteps, trails, or markers; they may not advance gameplay or enable a hit window. Replacing procedural meshes in M8 therefore must not change `GameRuntime` or combat contracts.
