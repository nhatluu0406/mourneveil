# M15 dungeon floorplan

Presentation rooms overlay the existing M5 gameplay topology. Zone IDs, encounters, checkpoint, shortcut, and final gate stay. Dimensions are meters, Y-up, derived from current zone bounds and connection anchors.

Camera looks from **+X / +Z** (closer-tactical offset). Camera-near edges are **east and north** → low parapets. Far edges **west and south** → tall walls. No roofs.

```
 x -16        -11   -8   -4  -3   1    4    7   10          16
z 9 ┌────────────┐
    │ OUTER WATCH│  arrival + watch (L)
  5 │      ┌─────┴──┐
    └──────┤  WATCH │
  2        │        │┌────────┐
           └────────┤ REFUGE  │
  0                 │ shrine  │
 -2                 └───┬─────┘
 -2        corridor     │
 -4  ───────────────────┴──┐ shortcut (gated, x=-3)
 -1                        │
           ┌─────────┬─────┴──────┬──────────┬──────────┐
           │  COURT  │ MIXED COURT│ ASH WALK │  FINAL   │
 -7        └─────────┴────────────┴──────────┤ APPROACH │
                                             └──┬───────┘
                                          gate  │  x=10
                                    ┌───────────┴────────┐
                                    │     SEPULCHRE      │
 -8                                 └────────────────────┘
```

## Rooms

| Room | Area | Floors (minX,maxX,minZ,maxZ) | Gameplay zone(s) | Landmark | Openings |
| --- | --- | --- | --- | --- | --- |
| outer-watch | first-combat | (−16,−11,3,9) + (−12,−7,0,5) | arrival, first-combat | veil monolith (−10.4, 1.2) | east to refuge at (−8,1); internal choke (−11,5) |
| refuge | refuge | (−8,−4,−2,2) | checkpoint | shrine (−5.5, 0) | west to watch; south to corridor (−5,−2) |
| corridor | corridor | (−8,−3,−5.5,−2) | checkpoint / mixed edge | none (bell on south far arch) | north to refuge; east to court (−3,−4) |
| court | court | (−3,1,−7,−1) | mixed-combat | funeral bowl (0.2, −6.2) | west from corridor; east to mixed (1,−4); shortcut north (−3,−1) |
| mixed-court | mixed-court | (1,4,−7,−1) | mixed-combat | spectral reliquary (3.4, −6.2) | west from court; east to ash (4,−4) |
| ash-walk | ash-walk | (4,7,−7,−1) | final-approach | veil lamp (5.5, −2.6) | west from mixed; east to approach (7,−4) |
| final-approach | final-approach | (7,10,−7,−1) | final-approach | cairn (8.4, −2.4) | west from ash; east gate (10,−4) |
| sepulchre | final-arena | (10,16,−8,0) | final-arena | arena seal (13, −4) | west gate (10,−4) |

## Connections (gameplay, unchanged IDs)

- `connection.arrival-first-combat` open (−11, 5)
- `connection.first-combat-checkpoint` open (−8, 1)
- `connection.checkpoint-mixed-long` open (−5, −4)
- `connection.shortcut-checkpoint-mixed` shortcut (−3, −1)
- `connection.mixed-final-approach` open (4, −4)
- `connection.gate-final-arena` gated (10, −4)

## Density

Per ordinary room: 1 landmark, 2–4 secondary architecture groups, 2–5 practical light groups, rubble/dressing in corners only, center playspace clear except the landmark.
