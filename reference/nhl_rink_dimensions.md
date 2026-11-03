# NHL rink dimensions

Source: NHL Official Rules 2025-26 (media.nhl.com/site/asset/public/ext/2025-26/2025-26Rules.pdf),
Rule 1 (Rink), Rule 2 (Goal), Rule 3 (Benches). Goal frame details: nhl_goal_frame.md.

Coordinates used by hokej/public/rink.js: feet, origin at centre ice, x along the rink
(goal lines at x = ±89), y across (boards at y = ±42.5).

## Rink and boards (1.2, 1.3)

| Item | Rule | Value (ft) |
|---|---|---|
| Length x width | 200 x 85 | 200, 85 |
| Corner radius | 28 ft | 28 |
| Board height | 40-48 in, ideal 42 in | 3.5 |
| Kick plate | light yellow, height not given | - |
| Glass above boards | 8 ft at ends, >= 6 ft sides | 8 / 6 |
| Penalty bench glass | >= 5 ft above boards | 5 |

## Lines (1.5)

| Item | Rule | Derived position (ft) |
|---|---|---|
| Goal line | 2 in wide, centre 11 ft from end | x = ±89, width 0.1667 |
| Blue lines | 12 in wide, 64 ft out from goal lines | edges ±25 to ±26, centre ±25.5 |
| Neutral zone | between blue lines | 50 ft |
| Centre line | 12 in, red, interval pattern, edges continuous | width 1 |
| Line colours | blue PMS 286, red PMS 186 | |

The 64 ft is read as goal line to the near edge of the blue line, which gives the
standard 50 ft neutral zone (89 - 64 = 25).

## Goal crease (1.7)

| Item | Rule | Derived (ft, from goal-line centre) |
|---|---|---|
| Side lines | 2 in, 1 ft outside each post, 4 ft 6 in long, at right angles to goal line | y = ±4, x 0 to 4.5 |
| Arc | 6 ft radius, 2 in wide, centred on goal-line centre | r = 6; meets side lines at x = sqrt(36-16) = 4.47 |
| Notch marks | 5 in, into the crease, 4 ft from goal line, on the side lines | x = 4, length 0.4167 |
| Fill | light blue PMS 298 | |
| Inside goal frame | gloss white | |
| Referee's crease | 10 ft radius semicircle, 2 in, red, in front of penalty timekeeper | centre (0, -42.5 or +42.5) |

## Goalkeeper trapezoid (1.8)

| Item | Rule | Derived |
|---|---|---|
| Lines | 2 in red, 8 ft outside each post at goal line | y = ±11 at x = ±89 |
| End | 11 ft from post at end boards | y = ±14 at x = ±100 |
| Continues | vertically up the kick plate | |

## Face-off spots and circles (1.9)

| Item | Rule | Derived (ft) |
|---|---|---|
| Centre spot | blue, 12 in diameter | r = 0.5 at (0,0) |
| Centre circle | blue, 15 ft radius, 2 in line | r = 15 |
| Neutral spots | red, 2 ft diameter, 5 ft from each blue line, 44 ft apart | (±20, ±22) |
| End-zone spots | 20 ft from goal line, 22 ft each side of the goal axis | (±69, ±22) |
| Spot pattern | two lines 3 in from top and bottom; between them red, rest white | red band 1.5 ft of 2 ft |
| End circles | 15 ft radius, 2 in line | r = 15 |
| Hash marks | 2 in x 2 ft, parallel to goal line, at the circle outer edge both sides, 5 ft 7 in apart | gap 5.583 |
| L marks, long | 1 ft from outer edge of spot, parallel to side boards, 4 ft long, 18 in apart | x from 2 to 6 from spot centre, y = ±0.75 |
| L marks, short | parallel to end boards, from the end nearest the spot, 2 ft 10 in | length 2.833 |

Neutral spots: 25.5 - 0.5 - 5 = 20 using the blue-line edge at 25; the rule does not
state whether 5 ft is to the spot centre or edge. 20 is the common published value.

## Goal (2.1, 2.2)

Posts 6 ft apart inside, 4 ft high; red posts and crossbar, white elsewhere. Mesh 2.5 in.
Skirt 6 in back from the inside of the post, not more than 1 in above the base plate.
Full frame: nhl_goal_frame.md.

## Benches (3.1, 3.2)

| Item | Rule |
|---|---|
| Players' bench | 24 ft long each, >= 14 persons, two doors each, mirrored, same side, near centre |
| Penalty benches | opposite the players' benches, either side of the timekeeper, in the neutral zone, total 10 persons incl. off-ice officials |

Penalty bench length and door width are not given in the rules.
