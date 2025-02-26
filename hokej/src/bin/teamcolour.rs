use std::error::Error;
// crates
use serde::{Deserialize, Serialize};
use serde_json::Value;
use url::Url;
//use url::Url;
//use reqwest;


// teams
#[derive(Debug, Serialize, Deserialize)]
struct TeamData {
    // ordered from first to last by time and period
    #[serde(rename = "data")]
    teams: Vec<Team>,
}


// teams info 
#[derive(Debug, Serialize, Deserialize, Default)]
struct Team {
    #[serde(rename = "id")]
    id: i32,
    #[serde(rename = "franchiseId")]
    franchise_id: Option<i32>,
    #[serde(rename = "fullName")]
    full_name: String,
    #[serde(rename = "leagueId")]
    league_id: i32,
    #[serde(rename = "rawTricode")]
    raw_tricode: String,
    #[serde(rename = "triCode")]
    tricode: String, 
}


// schedule
//games
#[derive(Debug, Serialize, Deserialize)]
struct Schedule {
    #[serde(rename = "games")]
    games: Option<Vec<GameData>>
}

//gamedetails
#[derive(Debug, Serialize, Deserialize)]
struct GameData {
    #[serde(rename = "awayTeam")]
    away_team: TeamInfo,
    #[serde(rename = "homeTeam")]
    home_team: TeamInfo,
}

// teams info 
#[derive(Debug, Serialize, Deserialize)]
struct TeamInfo {
    //home or away
    //
    #[serde(rename = "abbrev")]
    abbrev: String,
    #[serde(rename = "darkLogo")]
    dark_logo: String,
    #[serde(rename = "logo")]
    logo: String,
}

// to check the response as text if something isn't working
#[allow(dead_code)]
async fn fetch_as_text(url: &str) -> Result<String, Box<dyn Error>> {
    let response = reqwest::get(url).await?;
    let text = response.text().await?;
    //println!("Response: {}", text);
    Ok(text)
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

async fn fetch_as_json_value(
    url: &str
) -> Result<serde_json::Value, Box<dyn Error>> {
    let response = reqwest::get(url).await?;
    let jason: serde_json::Value = response.json().await?;
    Ok(jason)
}

async fn find_logos(
    url: &str,
    tricode: &String,
) -> Result<(String, String), Box<dyn Error>> {
    //let json_data: Value = fetch_as_json_value(url).await?;
    //println!("{:?}", json_data);
    //println!("{}", serde_json::to_string_pretty(&json_data)?);
    let schedule: Schedule = fetch_as_json(url).await?;
    let mut logo = String::new();
    let mut dlogo = String::new();
    
    /*
    while let Some(game) = &schedule.games {
        println!("{}", game.unwrap().home_team.abbrev);
        break;
    }
    */
    // Check if games exist and then iterate through them
    if let Some(games) = &schedule.games {
        // Now games is a Vec<GameData>, so we can access the first game directly
        if !games.is_empty() {
            // refactor
            let h = &games[0].home_team;
            let a = &games[0].away_team;


            println!("home:{}", h.abbrev);
            println!("away:{}", a.abbrev);
            println!("target:{}", tricode);
            //let h = &games[0].home_team.abbrev;
            //let a = &games[0].away_team.abbrev;
            
            
            if *tricode == h.abbrev {
                logo = fetch_as_text(&h.logo).await?;
                dlogo = fetch_as_text(&h.dark_logo).await?;
            } else if *tricode == a.abbrev {
                logo = fetch_as_text(&a.logo).await?;
                dlogo = fetch_as_text(&a.dark_logo).await?;
            }
            //println!("{}\n{}", logo, dlogo);


        }
    }
   
    Ok((logo, dlogo))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
//- Teams - https://api.nhle.com/stats/rest/en/team
    // get the 3 letter code for each team
    //let mut codes: Vec<String> = vec![];
    // make the url
    let team_url = Url::parse("https://api.nhle.com/stats/rest/en/team")?;
    let team_data: TeamData = fetch_as_json(&team_url.as_str()).await?;
    //let json_data: Value = fetch_as_json_value(&team_url.as_str()).await?;
    //println!("{:?}", json_data);
    //println!("{}", serde_json::to_string_pretty(&json_data)?);
    //println!("{:?}", &team_data);
    
    // find our tricodes
    //let mut c = 0;
    for team in &team_data.teams {
        //if team.franchise_id.is_none() {
        //    println!("Team '{}' has no franchise_id", team.full_name);
        //}
        let base_api = Url::parse("https://api-web.nhle.com/v1/club-schedule-season/")?;
        let tricode_url = format!("{}/20242025", &team.tricode);
        let full_url = base_api.join(&tricode_url)?;
        println!("{}", &full_url.as_str());
        let (logo, dlogo) = find_logos(
                                &full_url.as_str(),
                                &team.tricode
                            ).await?;
        //if c >= 12 {
        //    break;
        //}
        //c += 1;
    }


//- Schedule - https://api-web.nhle.com/v1/club-schedule-season/TOR/20232024
    //
    //
    //



    Ok(())
}
