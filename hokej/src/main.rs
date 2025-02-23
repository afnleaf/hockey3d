#![allow(dead_code)]
#![allow(unused_variables)]

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
mod jsonparser;


//#[derive(Debug)]
//struct Embed {
//    //local css
//    //external css
//    //local scripts
//    //external scripts
//    //what else
//}

// head part of html
fn head(css: String) -> Markup {
    let viewport = concat!(
        "width=device-width, ",
        "initial-scale=1, ",
        "maximum-scale=1, ",
        "user-scalable=0"
    );
    html! {
        (DOCTYPE)
        meta charset = "utf-8";
        meta name = "viewport" content = (viewport);
        title { "hokej" }
        style { (css) }
    }
}

// replace problematic characters
// tokens to watch for:
// &amp; -> &
// &lt; -> <
// &gt; -> >
// && getting encoded
// </script> appearing in strings
//Unexpected semicolons from minification
fn decode_js(js: &str) -> String {
    js.replace("&amp;", "&")
      .replace("&lt;", "<")
      .replace("&gt;", ">")
      .replace("&quot;", "\"")
      .replace("&#39;", "'")
}

// place a bunch of scripts
fn scripts(
    script_texts: Vec<String>,
    script_local: String,
    csv: String,
) -> Markup {
    html! {

        // you can do for loops in here :o
        @for script in &script_texts {
            script {
                (PreEscaped(decode_js(script)))
            }
        }
        script {
            (PreEscaped(format!("const csv=`{}`;", csv)))
        }
        script {
            (PreEscaped(decode_js(&script_local)))
        }
    }
}

// head
// body
// scripts
// combine into page
fn page(
    css: String,
    script_texts: Vec<String>,
    script_local: String,
    csv: String,
) -> Markup {
    html! {
        (head(css))
        body { (scripts(script_texts, script_local, csv)) }
    }
}

//let path = Path::new("../data/river-points.csv");
fn get_local_script(path: &Path) -> Result<String, Box<dyn Error>>{
    let mut file = File::open(path)?;
    let mut text = String::new();
    file.read_to_string(&mut text)?;
    //println!("{:?}", text);
    Ok(text)
}


// fetch text from external url
async fn fetch_as_text(url: &str) -> Result<String, Box<dyn Error>> {
    let response = reqwest::get(url).await?;
    let text = response.text().await?;
    Ok(text)
}

// go through each external script file
// saving 
async fn get_script_strings(
    script_urls: Vec<&str>
) -> Result<Vec<String>, Box<dyn Error>> {
    let mut script_strings: Vec<String> = vec![];
    for url in script_urls {
        let text = fetch_as_text(url).await?;
        script_strings.push(text);
    }
    Ok(script_strings) 
}

// append each external css file together
async fn get_css_string(
    css_urls: Vec<&str>
) -> Result<String, Box<dyn Error>> {
    let mut css_string = String::from(""); 
    for url in css_urls {
        let text = fetch_as_text(url).await?;
        css_string += &text;
    }
    Ok(css_string)
}

// save our string to an html file
fn save_html(html: String) -> Result<(), Box<dyn Error>> {
    // Create the directory and all its parent directories if they don't exist
    let output_dir = Path::new("../output");
    fs::create_dir_all(output_dir)?;

    // Now create the file
    let mut file = File::create(output_dir.join("index.html"))?;

    //let mut file = File::create("./output/index.html")?;
    file.write_all(html.as_bytes())?;
    Ok(())
}

// async !!
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>>{
    let base_api = Url::parse("https://api-web.nhle.com/v1/gamecenter/")?;
    let game_id = "2024190001";
    let game_url = format!("{}/play-by-play", game_id);
    let full_url = base_api.join(&game_url)?;
    
    let csv_texts: Vec<String> = vec![];
    let csv_content = jsonparser::pbp_to_csv(&full_url.as_str()).await?;
    println!("{}", csv_content);

    let css_urls = vec![
        "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"
    ];
    // use minified versions without module attributes
    let script_urls = vec![
        "https://cdn.jsdelivr.net/npm/three@0.172.2/build/three.min.js",
        "https://cdn.jsdelivr.net/npm/three@0.172.2/examples/js/controls/TrackballControls.min.js"
    ];

    //println!("script_urls= {:?}", script_urls);
    let css_text = get_css_string(css_urls).await?;
    let script_texts = get_script_strings(script_urls).await?;
    let script_local = get_local_script(Path::new("../public/script.js"))?;
    //println!("{:?}", script_texts);
    //println!("{:?}", script_local);

    //let records = parse_csv();
    let markup = page(css_text, script_texts, script_local, csv_content);
    let html = markup.into_string();
    //println!("{}", html);
    save_html(html)?;

    Ok(())
}

