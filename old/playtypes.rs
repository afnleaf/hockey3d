//use std::collections::HashMap;
use std::error::Error;
// crates
//use resvg::tiny_skia;
//use serde::{Deserialize, Serialize};
//use serde_json::Value;
//use resvg::tiny_skia::{Pixmap};
//use url::Url;
//use reqwest;
//use usvg;
//use resvg;
use hokej::teamcolour;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    teamcolour::playtypes().await?; 
    Ok(())
}
