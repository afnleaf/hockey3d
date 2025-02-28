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
//

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
// PreEscaped does this for us.
fn decode_js(js: &str) -> String {
    js.replace("&amp;", "&")
      .replace("&lt;", "<")
      .replace("&gt;", ">")
      .replace("&quot;", "\"")
      .replace("&#39;", "'")
}

// place a bunch of scripts
fn scripts(
    external_scripts_text: Vec<String>,
    local_scripts_text: Vec<String>,
    csv: String,
    away_team: String,
    home_team: String,
) -> Markup {
    html! {

        // you can do for loops in here :o
        // external scripts
        @for script in &external_scripts_text {
            script {
                //(PreEscaped(decode_js(script)))
                (PreEscaped(script))
            }
        }
        // play-by-play csv and team info
        script {
            (PreEscaped(format!(
                "const csv=`{}`;\nconst awayJSON=`{}`\n const homeJSON=`{}`\n", 
                csv,
                away_team,
                home_team,
            )))
        }
        // local scripts
        @for script in &local_scripts_text {
            script {
                (PreEscaped(script))
                //(PreEscaped(decode_js(script)))
            }
        }
        //script {
        //    (PreEscaped(decode_js(&script_local)))
        //}
    }
}

// head
// body
// scripts
// combine into page
pub fn page(
    css: String,
    external_scripts_text: Vec<String>,
    local_scripts_text: Vec<String>,
    csv: String,
    away_team: String,
    home_team: String,
) -> Markup {
    html! {
        (head(css))
        body { (scripts(
                    external_scripts_text,
                    local_scripts_text,
                    csv,
                    away_team,
                    home_team,
                )) 
        }
    }
}



// fetch text from external url
//async fn fetch_as_text(url: &str) -> Result<String, Box<dyn Error>> {
//    let response = reqwest::get(url).await?;
//    let text = response.text().await?;
//    Ok(text)
//}

// go through each external script file
// saving 
pub async fn get_external_scripts_text(
    script_urls: Vec<&str>
) -> Result<Vec<String>, Box<dyn Error>> {
    let mut script_strings: Vec<String> = vec![];
    for url in script_urls {
        //let text = fetch_as_text(url).await?;
        //script_strings.push(text);
        script_strings.push(reqwest::get(url).await?.text().await?);
    }
    Ok(script_strings) 
}

pub fn get_local_scripts_text(
    script_path_literals: Vec<&str>
) -> Result<Vec<String>, Box<dyn Error>> {
    let mut script_strings: Vec<String> = vec![];
    //let script_local = get_local_script(Path::new("../public/script.js"))?;
    for path in script_path_literals {
        script_strings.push(
            get_local_script(Path::new(path)).unwrap()
        )
    }
    Ok(script_strings)
}

//let path = Path::new("../data/river-points.csv");
pub fn get_local_script(path: &Path) -> Result<String, Box<dyn Error>>{
    let mut file = File::open(path)?;
    let mut text = String::new();
    file.read_to_string(&mut text)?;
    //println!("{:?}", text);
    Ok(text)
}

// append each external css file together
pub async fn get_css_string(
    css_urls: Vec<&str>
) -> Result<String, Box<dyn Error>> {
    let mut css_string = String::from(""); 
    for url in css_urls {
        //let text = fetch_as_text(url).await?;
        //css_string += &text;
        css_string += &reqwest::get(url).await?.text().await?;
    }
    Ok(css_string)
}

// save our string to an html file
pub fn save_html(html: String) -> Result<(), Box<dyn Error>> {
    // Create the directory and all its parent directories if they don't exist
    let output_dir = Path::new("../output");
    fs::create_dir_all(output_dir)?;

    // Now create the file
    let mut file = File::create(output_dir.join("index.html"))?;

    //let mut file = File::create("./output/index.html")?;
    file.write_all(html.as_bytes())?;
    Ok(())
}
