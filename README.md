# hockey3d
3d visualization of a hockey game from play by play data

**concept**:
- find play by play data
- parse out important game events into csv
- render scene using csv data

**example**:
- get game id from: https://api-web.nhle.com/v1/club-schedule-season/TOR/20242025
- get json data: https://api-web.nhle.com/v1/gamecenter/2024020884/play-by-play
- pull out the key value pairs that you want

**csv data points**:
- event_id,
- type_code,
- event_type,
- period,
- time_period_mmss,
- time_period_seconds,
- time_game_seconds,
- x_coord,
- y_coord,
- player_id,
- team_id,
- additional_info,
- highlight_clip_url

Ok we have our csv, so now what can we do with this?

For our first [visualization](https://stezup.dev/hokej) lets try a Three.js render of (x,y) for each shot with corresponding team color 

**What else?**:
- we have a 3d viz, is there more data to grab from the play by play?
- I would like to know what part of the next that shots go, where are saves and where are goals?


### API Routes
- Config - https://api.nhle.com/stats/rest/en/config
- PBP - https://api-web.nhle.com/v1/gamecenter/2023020204/play-by-play
- Skaters	- https://api.nhle.com/stats/rest/en/skater/bios?limit=-1&start=0&cayenneExp=seasonId=20232024
- Teams - https://api.nhle.com/stats/rest/en/team
- Schedule - https://api-web.nhle.com/v1/club-schedule-season/TOR/20232024
- Shift - https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId=2021020001
