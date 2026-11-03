# NHL goal frame geometry

Used by `createHockeyNet()` in `hokej/public/rink.js`. All values in inches.

## Sources

- A: NHL Official Rules 2025-26, page v "Approved Goal Frame" diagram and Rule 2.1/2.2.
  https://media.nhl.com/site/asset/public/ext/2025-26/2025-26Rules.pdf
- B: `nhl_goal_frame_2013_top_view.png` (THW, 2013-14 frame change; "not exactly to scale").

## Stated values

| Item | Value | Source |
|---|---|---|
| Opening between posts (inside) | 72 | A, Rule 2.1 |
| Posts centre to centre | 74 3/8 | A |
| Opening height (inside) | 48 | A, Rule 2.1 |
| Posts and crossbar | 2 3/8 OD Sch. 40 pipe, red | A |
| Base and top frame tube | 1.900 OD HSS, white | A, Rule 2.1 |
| Centre support tube | 1.315 OD HSS | A |
| Base depth | 40 | A and B |
| Base total width | 88 | B |
| Base back-corner radius | 18 (B), 20 (A) | conflict, see below |
| Top frame depth | 18 | A ("18"" label) |
| Top frame elbow | R39 3/8 | A, not used, see below |

## Derived (pipe centrelines)

- Post x = 74.375 / 2 = 37.1875
- Crossbar height y = 48 + 2.375 / 2 = 49.1875
- Base half width W = (88 - 1.9) / 2 = 43.05 (88 taken as outside width)
- Base depth D = 40 - 1.9 / 2 = 39.05 (40 taken to outside of back tube)
- Base corner arc centre = (W - R, D - R) = (25.05, 21.05), R = 18
- Base side: straight tangent from post foot (37.1875, 0) to the arc.
  Tangent point (42.185, 15.538), arc angle -17.83 deg, arc runs to 90 deg
  (back straight at y = 39.05 from x = -25.05 to 25.05).
- Top frame: quarter arcs R 18 from each crossbar end, centre (19.1875, 0),
  back straight at depth 18 from x = -19.1875 to 19.1875.
- Centre support: one tube from top frame back centre (0, 49.1875, -18)
  to base back centre (0, 0.95, -39.05).

## Assumptions (not in sources)

- Base corner radius: B (2013-14 change, 20 to 18) is used; A still prints R20".
  Which is current is unconfirmed.
- Top frame plan shape: A gives depth 18 and an R39 3/8 elbow label but no
  layout. Quarter arcs of R 18 fill the 18 depth; the R39 3/8 elbow is not modelled.
- Number of centre supports: A shows more than one ("supports"); one is modelled.
- Netting, base skirt/padding (Rule 2.2) and tie bars are not modelled.
