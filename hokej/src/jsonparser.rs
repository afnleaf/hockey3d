use std::error::Error;
//use std::collections::HashMap;
// crates
use serde::{Deserialize, Serialize};
use serde_json::Value;
//use url::Url;
//use reqwest;

#[derive(Debug, Serialize, Deserialize)]
pub struct GameData {
    #[serde(rename = "awayTeam")]
    away_team: TeamInfo,
    #[serde(rename = "homeTeam")]
    home_team: TeamInfo,
    // ordered from first to last by time and period
    #[serde(rename = "plays")]
    plays: Vec<Play>,
}


// teams info 
#[derive(Debug, Serialize, Deserialize)]
pub struct TeamInfo {
    //home or away
    //
    #[serde(rename = "commonName")]
    team_name: CommonName,
    #[serde(rename = "id")]
    id: i32,
    #[serde(rename = "abbrev")]
    code3: String,
    #[serde(rename = "score")]
    score: i32,
    #[serde(rename = "sog")]
    sog: i32,
    #[serde(rename = "logo")]
    logo: String,
    #[serde(rename = "darkLogo")]
    dark_logo: String,
} 

#[derive(Debug, Serialize, Deserialize)]
struct CommonName {
    //#[serde(rename = "default")]
    default: String,
}

// a list of all the plays during the game
#[derive(Debug, Serialize, Deserialize)]
pub struct PlayByPlay {
    pub plays: Vec<Play>,
}


// why does this need to be outside?
// cause period has multiple data in it
#[derive(Debug, Serialize, Deserialize)]
struct PeriodDescriptor {
    number: i32,
}

// top level play info
#[derive(Debug, Serialize, Deserialize)]
pub struct Play {
    #[serde(rename = "eventId")]
    event_id: i32,
    #[serde(rename = "typeCode")]
    type_code: i32,
    #[serde(rename = "typeDescKey")]
    type_desc_key: String,
    #[serde(rename = "periodDescriptor")]
    period_descriptor: PeriodDescriptor,
    #[serde(rename = "timeRemaining")]
    time_remaining: String,
    #[serde(rename = "timeInPeriod")]
    time_in_period: String,
    // a lot of info inside this!!!
    details: Option<PlayDetails>,
}

// the fields we are looking for inside the json
#[derive(Debug, Serialize, Deserialize)]
pub struct PlayDetails {
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
pub struct EventData {
    pub event_id: i32,
    pub type_code: i32,
    pub event_type: String,
    pub period: i32,
    pub time_period_mmss: String, // time in string format per period (MM)
    pub time_period_seconds: i32, // time in period (1199 to 0)
    pub time_game_seconds: i32, // time from game start (0 to 3600+)
    pub x_coord: Option<i32>,
    pub y_coord: Option<i32>,
    pub player_id: Option<i32>,
    pub team_id: Option<i32>,
    // split this into 2
    //additional_info: String,
    pub shot_type: Option<String>,
    pub shot_miss_reason: Option<String>,
    pub highlight_clip_url: Option<String>,
}


impl EventData {
    fn to_csv_row(&self) -> String {
        format!(
            "{},{},{},{},{},{},{},{},{},{},{},{},{},{}",
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
            //self.additional_info,
            self.shot_type.as_ref().unwrap_or(&String::new()),
            self.shot_miss_reason.as_ref().unwrap_or(&String::new()),
            self.highlight_clip_url.as_ref().unwrap_or(&String::new()),
        )
    }
}

// to check the response as text if something isn't working
#[allow(dead_code)]
pub async fn fetch_as_text(url: &str) -> Result<(), Box<dyn Error>> {
    let response = reqwest::get(url).await?;
    let text = response.text().await?;
    println!("Response: {}", text);
    Ok(())
}

// fetch generic json from external url
pub async fn fetch_as_json<T>(url: &str) -> Result<T, Box<dyn Error>> 
where 
    T: serde::de::DeserializeOwned, 
{
    let response = reqwest::get(url).await?;
    let jason = response.json::<T>().await?;
    Ok(jason)
}

pub async fn fetch_as_json_value(
    url: &str
) -> Result<serde_json::Value, Box<dyn Error>> {
    let response = reqwest::get(url).await?;
    let jason: serde_json::Value = response.json().await?;
    Ok(jason)
}

fn get_player_id_from_details(details: &PlayDetails) -> Option<i32> {
    details.shooting_player_id
        .or(details.scoring_player_id)
        .or(details.hitting_player_id)
        .or(details.blocking_player_id)
        .or(details.player_id)
}

pub fn process_play(play: &Play) -> Option<EventData> {
    if let Some(details) = &play.details {
        if details.x_coord.is_none() && details.y_coord.is_none() 
            && !matches!(play.type_code, 505 | 502 | 503) { 
                return None;
            }

        // process time string to simple second based integer values
        let (time_game_seconds, time_period_seconds) = calculate_time_values(
            play.period_descriptor.number,
            &play.time_remaining
        );

        // include additional_info from shot_type and reason
        //let additional_info = match (&details.shot_type, &details.reason) {
        //    (Some(shot), Some(reason)) => format!("{};{}", shot, reason),
        //    (Some(shot), None) => shot.clone(),
        //    (None, Some(reason)) => reason.clone(),
        //    (None, None) => String::new(),
        //};

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
            time_period_mmss: play.time_remaining.clone(),
            time_period_seconds: time_period_seconds,
            time_game_seconds: time_game_seconds,
            x_coord: details.x_coord,
            y_coord: details.y_coord,
            player_id: get_player_id_from_details(details),
            team_id: details.team_id,
            //additional_info,
            shot_type: details.shot_type.clone(),
            shot_miss_reason: details.reason.clone(),
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

pub async fn pbp_to_csv(url: &str) -> Result<String, Box<dyn Error>> {
    let game_data: PlayByPlay = fetch_as_json(url).await?;

    let mut events: Vec<EventData> = game_data.plays.iter()
        .filter_map(process_play)
        .collect();

    events.sort_by(|a, b| a.time_game_seconds.cmp(&b.time_game_seconds));

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
    shot_type,
    shot_miss_reason,
    highlight_clip_url
    "#.trim().replace("\n", "").replace("    ", "");

    let mut csv_content = String::from(raw_header);
    csv_content.push('\n');

    for event in events {
        csv_content.push_str(&event.to_csv_row());
        csv_content.push('\n');
    }

    Ok(csv_content)
}

// should just take the same exact json as a string
// then embed it directly?
//fn teams_info() {

//}
//


fn pbp_to_csv2(
    json_data: Value,
) -> Result<String, Box<dyn Error>> {
    // play by play data
    let game_data: PlayByPlay = serde_json::from_value(json_data)?;
    let mut plays: Vec<EventData> = game_data.plays.iter()
        .filter_map(process_play)
        .collect();
    plays.sort_by(|a, b| a.time_game_seconds.cmp(&b.time_game_seconds));
    
    
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
    shot_type,
    shot_miss_reason,
    highlight_clip_url
    "#.trim().replace("\n", "").replace("    ", "");

    let mut csv_content = String::from(raw_header);
    csv_content.push('\n');

    for play in plays {
        csv_content.push_str(&play.to_csv_row());
        csv_content.push('\n');
    }

    Ok(csv_content)
}

pub async fn process_pbp(
    url: &str
) -> Result<(String, String, String), Box<dyn Error>>{
    //let game_data: GameData = fetch_as_json(url).await?;
    let json_data: Value = fetch_as_json_value(url).await?;
    //println!("{:?}", json_data);
   
    // clone so we don't ruin the data that we need to parse
    let away_team = json_data["awayTeam"].clone();
    let home_team = json_data["homeTeam"].clone();
    //println!("{:?}", home_team);
    //println!("{:?}", away_team);
    //println!("Home Team:\n{}", serde_json::to_string_pretty(&home_team)?);
    //println!("\nAway Team:\n{}", serde_json::to_string_pretty(&away_team)?);

    let csv: String = pbp_to_csv2(json_data).unwrap();
    //println!("{:?}", csv);

    Ok((
        serde_json::to_string_pretty(&away_team)?, 
        serde_json::to_string_pretty(&home_team)?, 
        csv
    ))
}

/*
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let base_api = Url::parse("https://api-web.nhle.com/v1/gamecenter/")?;
    //let game_id = "2024020884";
    let game_id = "2024190001";
    //let game_id = "2024020869";
    let game_url = format!("{}/play-by-play", game_id);
    let full_url = base_api.join(&game_url)?;

    // read the JSON file
    //fetch_as_text(full_url.as_str()).await?;
    
    println!("{:?}", full_url.as_str());
    let game_data: PlayByPlay = fetch_as_json(full_url.as_str()).await?;

    // collect events in a vector list
    let mut events: Vec<EventData> = game_data.plays.iter()
        .filter_map(process_play)
        .collect();

    // sort by time_game_seconds
    events.sort_by(|a, b| a.time_game_seconds.cmp(&b.time_game_seconds));


    // create csv
    let output_path = PathBuf::from(r"./game_events.csv");
    let mut output = File::create(&output_path)?;
   
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
    shot_type,
    shot_miss_reason,
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
*/
