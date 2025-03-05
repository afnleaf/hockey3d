//use std::collections::HashMap;
use std::error::Error;
// crates
//use serde::{Deserialize, Serialize};
use serde_json::Value;
use url::Url;
//use reqwest;
use hokej::jsonparser;

// fetch teams
// get list of teams
// filter valid teams that have games in the nhl
// use tricode to fetch team schedule
// get list of games
// get all games ids
// fetch all game urls
// get play by play data for each game

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // get the tricode for each team
    let parsed_teams_api_url = Url::parse(
        "https://api.nhle.com/stats/rest/en/team"
    )?;
    let teams_api_url = parsed_teams_api_url.as_str();
    let teams_text = reqwest::get(teams_api_url).await?.text().await?;
    //let teams_json: Value = serde_json::from_str(&teams_text)?;
    let teams_data: jsonparser::TeamData = serde_json::from_str(&teams_text)?; 
    //let pbp: PlayByPlay = serde_json::from_str(&json_text)?;
    //let teams_data: jsonparser::TeamData = teams_json_text.json(); 
    
    for team in &teams_data.teams {
        // check idk why
        if team.franchise_id.is_none() {
            println!("Team '{}' has no franchise_id", team.full_name);
        }
        // to get schedule
        let parsed_schedule_url = Url::parse(
            &format!(
                "https://api-web.nhle.com/v1/club-schedule-season/{}/20232024",
                &team.tricode,
            )
        )?;
        let schedule_url = parsed_schedule_url.as_str();
        println!("Fetching {}", &schedule_url);
        let schedule_text = reqwest::get(schedule_url).await?.text().await?;
        //let schedule_json: Value = serde_json::from_str(&schedule_text)?;
        let schedule: jsonparser::Schedule = serde_json::from_str(&schedule_text)?;
        println!("-----");
        
        // multiple game ids via schedule
        if let Some(games) = &schedule.games {
            for game in games {
                let url = Url::parse(
                    &format!(
                        "https://api-web.nhle.com/v1/gamecenter/{}/play-by-play",
                        game.id,
                    )
                )?;
                println!("{}:{}", &team.tricode, &url);
                //let game_data: jsonparser::PlayByPlay = fetch_as_json(url.as_str())
                //                                            .await?;
                //let plays: Vec<jsonparser::EventData> = game_data.plays.iter()
                //    .filter_map(jsonparser::process_play)
                //    .collect();
                //plays.sort_by(
                //    |a, b| a.time_game_seconds.cmp(&b.time_game_seconds)
                //);
            }
        }
    }

    
    Ok(())
}

