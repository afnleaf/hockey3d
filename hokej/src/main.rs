//#![allow(dead_code)]
//#![allow(unused_variables)]

use std::fs::File;
use std::fs;
use std::io::prelude::*;
use std::path::Path;
use std::error::Error;
// crates
use maud::{DOCTYPE, html, Markup, PreEscaped};
use url::Url;
// use tokio;
// use reqwest;
// modules
mod htmlpacker;
mod jsonparser;



// async !!
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>>{
    //let game_id = "2024020884";
    //let game_id = "2024020869";
    //let game_id = "2024190001"; // swe can
    let game_id = "2024020918";
    let parsed_url = Url::parse(
        &format!(
            "https://api-web.nhle.com/v1/gamecenter/{}/play-by-play",
            game_id,
        )
    )?;
    let url = parsed_url.as_str();
    //let base_api = Url::parse("https://api-web.nhle.com/v1/gamecenter/")?;
    //let game_url = format!("{}/play-by-play", game_id);
    //let full_url = base_api.join(&game_url)?;
    
    let csv_texts: Vec<String> = vec![];
    //let csv_content = jsonparser::pbp_to_csv(&full_url.as_str()).await?;
    let csv_content = jsonparser::pbp_to_csv(url).await?;
    //println!("{}", csv_content);

    let (
        away_team, home_team, csv,
    ) = jsonparser::process_pbp(url).await?;
    
    //println!("{:?}", home_team);
    //println!("{:?}", away_team);
    //println!("{:?}", csv);

    let css_urls = vec![
        "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"
    ];
    // use minified versions without module attributes
    //let script_urls = vec![
    //    "https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.min.js",
    //    "https://cdn.jsdelivr.net/npm/three@0.172.0/examples/js/controls/TrackballControls.min.js"
    //];
    let external_scripts_list = vec![
        "https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js",
        "https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/controls/TrackballControls.min.js"
    ];

    let local_scripts_list = vec![
        "../public/arena.js",
        "../public/script.js",
        "../public/hud.js",
    ];

    //println!("script_urls= {:?}", script_urls);
    let css_text = htmlpacker::get_css_string(css_urls).await?;

    //let script_texts = get_script_strings(script_urls).await?;
    let external_scripts_text = htmlpacker::get_external_scripts_text(
                                    external_scripts_list).await?;
    //let script_local = get_local_script(Path::new("../public/script.js"))?;
    let local_scripts_text = htmlpacker::get_local_scripts_text(local_scripts_list)?;
    //println!("{:?}", external_scripts_text);
    //println!("{:?}", local_scripts_text);

    // one list of all the scripts?
    // pre process csv and json objects with the format!
    // before sending into page()
    //let embed_scripts: Vec<String> = vec![];
    //let records = parse_csv();

    let markup = htmlpacker::page(
        css_text,
        external_scripts_text,
        local_scripts_text,
        csv_content,
        away_team,
        home_team,
    );
    let html = markup.into_string();
    //println!("{}", html);
    htmlpacker::save_html(html)?;

    Ok(())
}

