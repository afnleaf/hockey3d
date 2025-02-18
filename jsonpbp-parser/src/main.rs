use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::error::Error;
// crates
use serde::{Deserialize, Serialize};
//use reqwest;


// a list of all the plays during the game
// ordered from first to last by time and period
#[derive(Debug, Serialize, Deserialize)]
struct PlayByPlay {
    plays: Vec<Play>,
}

// why does this need to be outside?
#[derive(Debug, Serialize, Deserialize)]
struct PeriodDescriptor {
    number: i32,
}

// top level play info
#[derive(Debug, Serialize, Deserialize)]
struct Play {
    #[serde(rename = "eventId")]
    event_id: i32,
    #[serde(rename = "typeCode")]
    type_code: i32,
    #[serde(rename = "typeDescKey")]
    type_desc_key: String,
    #[serde(rename = "periodDescriptor")]
    period_descriptor: PeriodDescriptor,
    #[serde(rename = "timeInPeriod")]
    time_in_period: String,
    // a lot of info inside this!!!
    details: Option<PlayDetails>,
}

// the fields we are looking for inside the json
#[derive(Debug, Serialize, Deserialize)]
struct PlayDetails {
    #[serde(rename = "xCoord")]
    x_coord: Option<i32>,
    #[serde(rename = "yCoord")]
    y_coord: Option<i32>,
    #[serde(rename = "eventOwnerTeamId")]
    team_id: Option<i32>,
    #[serde(rename = "shootingPlayerId")]
    shooting_player_id: Option<i32>,
    #[serde(rename = "scoringPlayerId")]
    scoring_player_id: Option<i32>,
    #[serde(rename = "hittingPlayerId")]
    hitting_player_id: Option<i32>,
    #[serde(rename = "blockingPlayerId")]
    blocking_player_id: Option<i32>,
    #[serde(rename = "playerId")]
    player_id: Option<i32>,
    #[serde(rename = "shotType")]
    shot_type: Option<String>,
    reason: Option<String>,
    #[serde(rename = "highlightClipSharingUrl")]
    highlight_clip_url: Option<String>,
}

// csv structure for our simplified game event data
// game_seconds: i32,   
// period_seconds: i32, 
#[derive(Debug)]
struct EventData {
    event_id: i32,
    type_code: i32,
    event_type: String,
    period: i32,
    time_period_mmss: String, // time in string format per period (MM)
    time_period_seconds: i32, // time in period (1199 to 0)
    time_game_seconds: i32, // time from game start (0 to 3600+)
    x_coord: Option<i32>,
    y_coord: Option<i32>,
    player_id: Option<i32>,
    team_id: Option<i32>,
    additional_info: String,
    highlight_clip_url: Option<String>,
}

impl EventData {
    fn to_csv_row(&self) -> String {
        format!(
            "{},{},{},{},{},{},{},{},{},{},{},{},{}",
            self.event_id,
            self.type_code,
            self.event_type,
            self.period,
            self.time_period_mmss,
            self.time_period_seconds,
            self.time_game_seconds,
            self.x_coord.unwrap_or(0),
            self.y_coord.unwrap_or(0),
            self.player_id.unwrap_or(0),
            self.team_id.unwrap_or(0),
            self.additional_info,
            self.highlight_clip_url.as_ref().unwrap_or(&String::new()),
        )
    }
}

// to check the response as text if something isn't working
#[allow(dead_code)]
async fn fetch_as_text(url: &str) -> Result<(), Box<dyn Error>> {
    let response = reqwest::get(url).await?;
    let text = response.text().await?;
    println!("Response: {}", text);
    Ok(())
}

// fetch generic json from external url
async fn fetch_as_json<T>(url: &str) -> Result<T, Box<dyn Error>> 
where 
    T: serde::de::DeserializeOwned, 
{
    let response = reqwest::get(url).await?;
    let jason = response.json::<T>().await?;
    Ok(jason)
}

fn get_player_id_from_details(details: &PlayDetails) -> Option<i32> {
    details.shooting_player_id
        .or(details.scoring_player_id)
        .or(details.hitting_player_id)
        .or(details.blocking_player_id)
        .or(details.player_id)
}

fn process_play(play: &Play) -> Option<EventData> {
    if let Some(details) = &play.details {
        if details.x_coord.is_none() && details.y_coord.is_none() 
            && !matches!(play.type_code, 505 | 502 | 503) { 
                return None;
            }

        // process time string to simple second based integer values
        let (time_game_seconds, time_period_seconds) = calculate_time_values(
            play.period_descriptor.number,
            &play.time_in_period
        );

        // include additional_info from shot_type and reason
        let additional_info = match (&details.shot_type, &details.reason) {
            (Some(shot), Some(reason)) => format!("{};{}", shot, reason),
            (Some(shot), None) => shot.clone(),
            (None, Some(reason)) => reason.clone(),
            (None, None) => String::new(),
        };

        // handle highlight clip URL for goals
        let highlight_clip_url = if play.type_code == 505 {
            details.highlight_clip_url.clone()
        } else {
            None
        };

        Some(EventData {
            event_id: play.event_id,
            type_code: play.type_code,
            event_type: play.type_desc_key.clone(),
            period: play.period_descriptor.number,
            time_period_mmss: play.time_in_period.clone(),
            time_period_seconds: time_period_seconds,
            time_game_seconds: time_game_seconds,
            x_coord: details.x_coord,
            y_coord: details.y_coord,
            player_id: get_player_id_from_details(details),
            team_id: details.team_id,
            additional_info,    
            highlight_clip_url,
        })
    } else {
        None
    }
}

// convert MM:SS string to seconds from start of period and game
fn calculate_time_values(period: i32, time_str: &str) -> (i32, i32) {
    let parts: Vec<&str> = time_str.split(':').collect();
    let (min, sec) = match parts.as_slice() {
        [mm, ss] => (mm.parse::<i32>().unwrap_or(0),
                     ss.parse::<i32>().unwrap_or(0)),
        _ => (0, 0),
    };
    // will need to refactor to handle playoff games
    let time_period_seconds = 1200 - (min * 60 + sec);
    let time_game_seconds = match period {
        1 => time_period_seconds,
        2 => 1200 + time_period_seconds,
        3 => 2400 + time_period_seconds,
        4 => 3600 + time_period_seconds,
        _ => time_period_seconds,
    };
    (time_game_seconds, time_period_seconds)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let game_url = "https://api-web.nhle.com/v1/gamecenter/2024020884/play-by-play";
    //fetch_as_text(game_url).await?;
    // read the JSON file
    let game_data: PlayByPlay = fetch_as_json(game_url).await?;

    // collect events in a vector list
    let mut events: Vec<EventData> = game_data.plays.iter()
        .filter_map(process_play)
        .collect();

    // sort by time_game_seconds
    events.sort_by(|a, b| a.time_game_seconds.cmp(&b.time_game_seconds));


    // create csv
    let output_path = PathBuf::from(r"./game_events.csv");
    let mut output = File::create(&output_path)?;
   

    //let raw_header = r#"event_id,type_code,event_type,period,time_period_mmss,time_period_seconds,time_game_seconds,x_coord,y_coord,player_id,team_id,additional_info,highlight_clip_url"#.trim();
    let raw_header = r#"
    event_id,
    type_code,
    event_type,
    period,
    time_period_mmss,
    time_period_seconds,
    time_game_seconds,
    x_coord,
    y_coord,
    player_id,
    team_id,
    additional_info,
    highlight_clip_url
    "#.trim().replace("\n", "").replace("    ", "");

    // write csv header
    writeln!(output, "{}", &raw_header)?;

    for event in events {
        writeln!(output, "{}", event.to_csv_row())?;
    }

    println!("Event data has been written to {:?}", &output_path);
    Ok(())
}


