use std::error::Error;
use std::fs;
use std::path::Path;
use std::process::Command;

use url::Url;

mod jsonparser;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let game_id = "2024020918";
    let parsed_url = Url::parse(&format!(
        "https://api-web.nhle.com/v1/gamecenter/{}/play-by-play",
        game_id,
    ))?;
    let url = parsed_url.as_str();

    let (away_team, home_team, csv) = jsonparser::process_pbp(url).await?;

    write_data_js(Path::new("./public/data.js"), &csv, &away_team, &home_team)?;

    let output = Path::new("../output/index.html");
    if let Some(parent) = output.parent() {
        fs::create_dir_all(parent)?;
    }

    let status = Command::new("histos")
        .args(["histos.yaml", "-o", output.to_str().unwrap()])
        .status()?;

    if !status.success() {
        return Err(format!("histos exited with {}", status).into());
    }

    Ok(())
}

fn write_data_js(
    path: &Path,
    csv: &str,
    away_team: &str,
    home_team: &str,
) -> Result<(), Box<dyn Error>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let contents = format!(
        "const csv = {};\nconst awayJSON = {};\nconst homeJSON = {};\n",
        serde_json::to_string(csv)?,
        serde_json::to_string(away_team)?,
        serde_json::to_string(home_team)?,
    );
    fs::write(path, contents)?;
    Ok(())
}
