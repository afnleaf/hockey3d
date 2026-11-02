# NHL game data schema

Reference game: 2026020224, TOR @ VAN, 2026-10-31 (final 306 plays, 734 shifts).
Sources are the raw NHL feeds served by `nhl_record_relay`. The browser parses them; no pre-parsing.

## Game ID

`SSSSTTNNNN`: season start year, game type (`01` pre, `02` regular, `03` playoff, `04` all-star), game number.
Relay and client accept IDs from `2009020000` (2009-10 regular season) onward.

## play-by-play (`/v1/gamecenter/{id}/play-by-play`)

Top level: `id`, `season` (`20262027`), `gameType`, `gameDate`, `startTimeUTC`, `gameState` (`FUT`, `LIVE`, `CRIT`, `OFF`, `FINAL`), `periodDescriptor`, `clock`, `homeTeam`, `awayTeam`, `plays[]`, `rosterSpots[]`, `gameOutcome`, `summary`, `venue`, `tvBroadcasts`, `regPeriods`, `otInUse`, `shootoutInUse`.

`homeTeam` / `awayTeam`: `id`, `abbrev`, `commonName.default`, `placeName.default`, `score`, `sog`, `logo`, `darkLogo`.

`rosterSpots[]`: `teamId`, `playerId`, `firstName.default`, `lastName.default`, `sweaterNumber`, `positionCode` (`C L R D G`), `headshot`.

### plays[]

Common fields:

| field | example | notes |
|---|---|---|
| `eventId` | 57 | unique within game, not ordered |
| `sortOrder` | 17 | use for ordering |
| `periodDescriptor` | `{number:1, periodType:"REG"}` | `REG`, `OT`, `SO` |
| `timeInPeriod` / `timeRemaining` | `"00:30"` / `"19:30"` | mm:ss |
| `situationCode` | `"1551"` | away goalie, away skaters, home skaters, home goalie |
| `homeTeamDefendingSide` | `"right"` | flips per period; needed to normalize x |
| `typeCode` / `typeDescKey` | 502 / `faceoff` | see table |
| `details` | | per type, absent for some |

Coordinates: `xCoord` -100..100, `yCoord` -42.5..42.5 (feet, center ice 0,0). `zoneCode` `O`/`D`/`N` relative to `eventOwnerTeamId`.

### Types (counts for 2026020224)

| code | key | n | details |
|---|---|---|---|
| 502 | faceoff | 54 | winningPlayerId, losingPlayerId, x/y, zone |
| 503 | hit | 57 | hittingPlayerId, hitteePlayerId, x/y, zone |
| 504 | giveaway | 21 | playerId, x/y, zone |
| 505 | goal | 6 | scoringPlayerId, assist1/2PlayerId (+Total), goalieInNetId, shotType, homeScore, awayScore, highlightClip*, x/y, zone |
| 506 | shot-on-goal | 50 | shootingPlayerId, goalieInNetId, shotType, homeSOG, awaySOG, x/y, zone |
| 507 | missed-shot | 23 | shootingPlayerId, goalieInNetId, shotType, reason, x/y, zone |
| 508 | blocked-shot | 35 | shootingPlayerId, blockingPlayerId, reason, x/y, zone |
| 509 | penalty | 6 | committedByPlayerId, drawnByPlayerId, descKey, duration, typeCode, x/y, zone |
| 516 | stoppage | 43 | reason, secondaryReason (no coords) |
| 520 | period-start | 3 | none |
| 521 | period-end | 3 | none |
| 524 | game-end | 1 | none |
| 525 | takeaway | 4 | playerId, x/y, zone |

All `details` carry `eventOwnerTeamId` except stoppage and period markers. Missed-shot `reason` (`wide-of-net`, `high-and-wide`, `hit-crossbar`, ...) is the only miss precision the API gives; there is no miss coordinate at the net.

## boxscore (`/v1/gamecenter/{id}/boxscore`)

Same header fields as play-by-play, plus `playerByGameStats.{homeTeam,awayTeam}.{forwards,defense,goalies}[]` (per-player totals). Used for the scoreboard, not for events.

## shiftcharts (`/stats/rest/en/shiftcharts?cayenneExp=gameId={id}`)

`{ data: [...], total }`. One row per shift (`typeCode` 517):
`playerId`, `firstName`, `lastName`, `teamId`, `teamAbbrev`, `period`, `startTime`, `endTime`, `duration` (mm:ss in period), `shiftNumber`, `hexValue` (team color).
Goal rows (`typeCode` 505) also appear with `eventDescription`/`eventDetails` set and `duration` null; filter on 517 for on-ice reconstruction.

## Era notes

2009-10 regular season has full events (2009020001: 275 plays). 2009 preseason has goals only, so it is excluded.
