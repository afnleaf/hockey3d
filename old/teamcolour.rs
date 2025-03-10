use std::collections::HashMap;
use std::error::Error;
// crates
//use resvg::tiny_skia;
use serde::{Deserialize, Serialize};
//use serde_json::Value;
use resvg::tiny_skia::{Pixmap};
use url::Url;
//use reqwest;
//use usvg;
//use resvg;
use crate::jsonparser;


// to check the response as text if something isn't working
//#[allow(dead_code)]
//async fn fetch_as_text(url: &str) -> Result<String, Box<dyn Error>> {
//    let response = reqwest::get(url).await?;
//    let text = response.text().await?;
//    //println!("Response: {}", text);
//    Ok(text)
//}
//
//// fetch generic json from external url
//async fn fetch_as_json<T>(url: &str) -> Result<T, Box<dyn Error>> 
//where 
//    T: serde::de::DeserializeOwned, 
//{
//    let response = reqwest::get(url).await?;
//    let jason = response.json::<T>().await?;
//    Ok(jason)
//}
//
//#[allow(dead_code)]
//async fn fetch_as_json_value(
//    url: &str
//) -> Result<serde_json::Value, Box<dyn Error>> {
//    let response = reqwest::get(url).await?;
//    let jason: serde_json::Value = response.json().await?;
//    Ok(jason)
//}

async fn find_logos(
    url: &str,
    tricode: &String,
) -> Result<(String, String), Box<dyn Error>> {
    //let json_data: Value = fetch_as_json_value(url).await?;
    //println!("{:?}", json_data);
    //println!("{}", serde_json::to_string_pretty(&json_data)?);
    let schedule: Schedule = fetch_as_json(url).await?;
    // will be raw svg string
    let mut logo = String::new();
    let mut dlogo = String::new();
    
    /*
    while let Some(game) = &schedule.games {
        println!("{}", game.unwrap().home_team.abbrev);
        break;
    }
    */
    // check if games exist and then iterate through them
    if let Some(games) = &schedule.games {
        // games is a Vec<GameData>, so we can access the first game directly
        // no need to loop through the entire schedule
        if !games.is_empty() {
            let h = &games[0].home_team;
            let a = &games[0].away_team;

            println!("home:{}", h.abbrev);
            println!("away:{}", a.abbrev);
            println!("target:{}", tricode);
            //let h = &games[0].home_team.abbrev;
            //let a = &games[0].away_team.abbrev;
            
            // match the tricode to either the home or away team         
            if *tricode == h.abbrev {
                logo = fetch_as_text(&h.logo).await?;
                dlogo = fetch_as_text(&h.dark_logo).await?;
            } else if *tricode == a.abbrev {
                logo = fetch_as_text(&a.logo).await?;
                dlogo = fetch_as_text(&a.dark_logo).await?;
            }
            //println!("{}\n{}", logo, dlogo);
        } else {
            return Err(format!("Team {} has no schedule data \
                (likely an old/inactive team)", tricode).into());
        }
    }
   
    Ok((logo, dlogo))
}


// idea is to return the hexcode of the most common colour
fn find_main_colour_logo_svg(
    logo: String
) -> Result<String, Box<dyn Error>> {

    // easiest way is to turn logo into png?
    //
    // parse SVG string
    let opts = usvg::Options::default();
    let tree = usvg::Tree::from_str(&logo, &opts)?;
    //let tree = usvg::Tree::from_str(&logo, &usvg::Options::default())?;

    // create bitmap to be our render target
    //let pixmap_size = tree.size().to_screen_size();
    //let mut pixmap = Pixmap::new(pixmap_size.width(), pixmap_size.height())
    //    .ok_or("Failed to create pixmap")?;

    let size = tree.size();
    let width = size.width() as u32;
    let height = size.height() as u32;
    let mut pixmap = resvg::tiny_skia::Pixmap::new(width, height)
        .ok_or("Failed to create pixmap")?;

    //let mut pixmap = resvg::tiny_skia::Pixmap::new(pixmap_size.width(), pixmap_size.height())
    //    .ok_or("Failed to create pixmap")?;

    // render SVG -> bitmap
    resvg::render(&tree, resvg::tiny_skia::Transform::identity(), &mut pixmap.as_mut());
    //resvg::render(&tree, usvg::FitTo::Original, pixmap.as_mut())
    //    .ok_or("Failed to render SVG")?;

    // now with pixmap find the colour 
    //let most_common_pixel_color = count_most_common_pixel_color(&pixmap);
    let hexcode = count_most_common_pixel_color(&pixmap).unwrap();

    Ok(hexcode)
}

fn count_most_common_pixel_color(
    pixmap: &Pixmap
) -> Result<String, Box<dyn Error>> {
    //resvg::render(&tree, resvg::tiny_skia::Transform::identity(), pixmap.as_mut());
    // Get pixel data
    let pixels = pixmap.data();

    let mut color_counts: HashMap<(u8, u8, u8, u8), usize> = HashMap::new();
    
    // tiny_skia uses premultiplied RGBA format
    for chunk in pixels.chunks(4) {
        if chunk.len() == 4 {
            let color = (chunk[0], chunk[1], chunk[2], chunk[3]);
            //*color_counts.entry(color).or_insert(0) += 1;
            //println!("{:?}", color);
            if color.3 > 0 {
                *color_counts.entry(color).or_insert(0) += 1;
            }
        }
    }

    // Find the most common color
    let most_common_color = color_counts.iter()
        .max_by_key(|&(_, count)| count)
        .map(|((r, g, b, _), _)| format!("0x{:02X}{:02X}{:02X}", r, g, b))
        .ok_or("No colors found")?;

    println!("{}", most_common_color);

    Ok(most_common_color)
}


#[derive(Debug)]
struct Info {
    tricode: String,
    id: i32,
    main_colour: String,
    dark_colour: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
//- Teams - https://api.nhle.com/stats/rest/en/team
    // get the 3 letter code for each team
    //let mut codes: Vec<String> = vec![];
    // make the url
    let team_url = Url::parse("https://api.nhle.com/stats/rest/en/team")?;
    let team_data: jsonparser::TeamData = fetch_as_json(&team_url.as_str())
                                            .await?;
    //let json_data: Value = fetch_as_json_value(&team_url.as_str()).await?;
    //println!("{:?}", json_data);
    //println!("{}", serde_json::to_string_pretty(&json_data)?);
    //println!("{:?}", &team_data);
    //
    let mut teams: Vec<Info> = vec![]; 
    
    // find our tricodes
    //let mut c = 0;
    for team in &team_data.teams {
        //if team.franchise_id.is_none() {
        //    println!("Team '{}' has no franchise_id", team.full_name);
        //}
        let base_api = Url::parse(
                        "https://api-web.nhle.com/v1/club-schedule-season/"
                       )?;
        let tricode_url = format!("{}/20242025", &team.tricode);
        let full_url = base_api.join(&tricode_url)?;
        println!("{}", &full_url.as_str());
        //let (logo, dlogo) = find_logos(
        //                        &full_url.as_str(),
        //                        &team.tricode
        //                    ).await?;

        match find_logos(&full_url.as_str(), &team.tricode).await {
            Ok((logo, dlogo)) => {
                let logo_colour = find_main_colour_logo_svg(logo).unwrap();
                let dlogo_colour = find_main_colour_logo_svg(dlogo).unwrap();

                teams.push(Info {
                    tricode: team.tricode.clone(),
                    id: team.id,
                    main_colour: logo_colour,
                    dark_colour: dlogo_colour,
                });
            }
            _ => {}
        }

        //let _ = find_main_colour_logoSVG(logo);
        //let _ = find_main_colour_logoSVG(dlogo);
        //find_main_colour_logoSVG(logo)?;
        //find_main_colour_logoSVG(dlogo)?;
        //if c >= 2 {
        //    break;
        //}
        //c += 1;
    }
    // hash table for team id: hex colors
    //const colors = {
    //    //10: 0x082057,
    //    //23: 0x0a1b2b
    //    //23: 0xf5e4d4,
    //    //23: 0xff1111,
    //    66: 0xfed000,
    //    60: 0xff1111,
    //}


    teams.sort_by_key(|team| team.id);
    for team in &teams {
        println!("{}: {}", &team.id, &team.main_colour);
    }

    //println!("{:?}", &teams);


//- Schedule - https://api-web.nhle.com/v1/club-schedule-season/TOR/20232024
    //
    //
    //



    Ok(())
}

// fetch team schedule
// get list of games
// get all games ids
// fetch all game urls
//

fn event_types2(
    plays: &Vec<jsonparser::EventData>
) -> Result<(), Box<dyn Error>> {
    let mut event_strings: HashMap<String, usize> = HashMap::new();
    
    for play in plays {
        //play.event_type
        *event_strings.entry(play.event_type.clone()).or_insert(0) += 1;
    }
    
    for event in event_strings.keys() {
        println!("{}", event);
    }
    //println!("{:?}", event_strings);

    Ok(())
}

fn event_types(
    plays: &Vec<jsonparser::EventData>,
    event_counts: &mut HashMap<String, usize>
) {
    for play in plays {
        //*event_counts.entry(play.event_type.clone()).or_insert(0) += 1;
        *event_counts.entry(play.type_code.to_string()).or_insert(0) += 1;
    }
}

pub async fn playtypes() -> Result<(), Box<dyn Error>> {
    let mut event_counts: HashMap<String, usize> = HashMap::new();

    // multiple game ids via schedule
    let sch = Url::parse("https://api-web.nhle.com/v1/club-schedule-season/TOR/20232024")?;
    //let tricode_url = format!("{}/20242025", &team.tricode);
    //let full_url = base_api.join(&tricode_url)?;    
    let schedule: jsonparser::Schedule = fetch_as_json(sch.as_str()).await?;
    if let Some(games) = &schedule.games {
        for game in games {
            let url = Url::parse(
                &format!(
                    "https://api-web.nhle.com/v1/gamecenter/{}/play-by-play",
                    game.id,
                )
            )?;
            println!("{}", &url);
            let game_data: jsonparser::PlayByPlay = fetch_as_json(url.as_str())
                                                                .await?;
            let plays: Vec<jsonparser::EventData> = game_data.plays.iter()
                .filter_map(jsonparser::process_play)
                .collect();
            //plays.sort_by(|a, b| a.time_game_seconds.cmp(&b.time_game_seconds));
            // find all types of events?
            //event_types(&plays)?;
            event_types(&plays, &mut event_counts);
        }
    }

    println!("\nEvent Types Summary:");
    println!("-----------------");
    
    // sort events by frequency
    let mut events: Vec<(&String, &usize)> = event_counts.iter().collect();
    // count in descending order
    events.sort_by(|a, b| b.1.cmp(a.1)); 
    
    for (event, count) in events {
        println!("{}: {}", event, count);
    }
    
    println!("\nTotal unique event types: {}", event_counts.len());


    /*
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

    let json_data: Value = fetch_as_json_value(url).await?;
    let csv: String = pbp_to_csv2(json_data).unwrap();
    
    //let json_data: Value = fetch_as_json_value(&team_url.as_str()).await?;
    //println!("{:?}", json_data);
    //println!("{}", serde_json::to_string_pretty(&json_data)?);
    //println!("{:?}", &team_data);
    //
    let mut teams: Vec<Info> = vec![]; 
    
    // will be raw svg string
    let mut logo = String::new();
    let mut dlogo = String::new();
    */
    
    Ok(())
}
