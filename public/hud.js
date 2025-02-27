// HUD via DOM

// parse team info
const awayTeam = JSON.parse(awayJSON);
const homeTeam = JSON.parse(homeJSON);

// Team colors mapping from hexadecimal values in script.js
//const teamColors = {
//  66: '#fed000', // Sweden (yellow)
//  60: '#ff1111', // Canada (red)
//  // These colors should match the ones in the colors object in script.js
//};
//console.log(teamColors);
//
const teamColorsH = {
    1: "#CC0000",
    2: "#00468B",
    3: "#154B94",
    4: "#000000",
    5: "#000000",
    6: "#010101",
    7: "#003087",
    8: "#A6192E",
    9: "#010101",
    10: "#00205B",
    12: "#FFFFFF",
    13: "#041E42",
    14: "#00205B",
    15: "#041E42",
    16: "#010101",
    17: "#C8102E",
    18: "#FFFFFF",
    19: "#004986",
    20: "#C8102E",
    21: "#FFFFFF",
    22: "#00205B",
    23: "#00205B",
    24: "#010101",
    25: "#000000",
    26: "#A2AAAD",
    28: "#010101",
    29: "#041E42",
    30: "#0E4431",
    52: "#041E42",
    54: "#000000",
    55: "#001425",
    59: "#6CACE4",
};

// Get team colors or use defaults
const awayTeamColor = teamColorsH[awayTeam.id] || '#ff0000';
const homeTeamColor = teamColorsH[homeTeam.id] || '#00ff00';

// Create main HUD container
const hudContainer = document.createElement('div');
hudContainer.id = 'hud-container';
hudContainer.style.cssText = `
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  font-family: 'Arial', sans-serif;
`;

// Create scoreboard container
const scoreboard = document.createElement('div');
scoreboard.id = 'scoreboard';
scoreboard.style.cssText = `
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.85);
  color: white;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  width: calc(100% - 40px);
  max-width: 800px;
  pointer-events: auto;
`;

// Function to create team display
function createTeamDisplay(team, isHome) {
  const teamColor = isHome ? homeTeamColor : awayTeamColor;
  
  const teamContainer = document.createElement('div');
  teamContainer.className = isHome ? 'home-team' : 'away-team';
  teamContainer.style.cssText = `
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 45%;
    position: relative;
    justify-content: ${isHome ? 'flex-end' : 'flex-start'};
  `;
  
  // Color accent
  const colorAccent = document.createElement('div');
  colorAccent.className = 'team-color-accent';
  colorAccent.style.cssText = `
    position: absolute;
    top: -15px;
    bottom: -15px;
    width: 5px;
    background-color: ${teamColor};
    ${isHome ? 'right: -15px;' : 'left: -15px;'}
    border-radius: ${isHome ? '0 5px 5px 0' : '5px 0 0 5px'};
  `;
  
  // Team logo
  const logo = document.createElement('img');
  logo.className = 'team-logo';
  logo.src = team.darkLogo;
  logo.alt = `${team.commonName.default} logo`;
  logo.style.cssText = `
    height: 50px;
    width: auto;
    margin: ${isHome ? '0 0 0 15px' : '0 15px 0 0'};
    object-fit: contain;
  `;
  
  // Team info container
  const info = document.createElement('div');
  info.className = 'team-info';
  info.style.cssText = `
    text-align: ${isHome ? 'right' : 'left'};
  `;
  
  // Team abbreviation
  const abbrev = document.createElement('div');
  abbrev.className = 'team-abbrev';
  abbrev.textContent = team.abbrev;
  abbrev.style.cssText = `
    font-size: 28px;
    font-weight: bold;
  `;
  
  // Team full name
  const name = document.createElement('div');
  name.className = 'team-name';
  name.textContent = team.commonName.default;
  name.style.cssText = `
    font-size: 14px;
    opacity: 0.8;
  `;
  
  // Team shots on goal stats
  const stats = document.createElement('div');
  stats.className = 'team-stats';
  stats.style.cssText = `
    font-size: 14px;
    margin-top: 5px;
  `;
  stats.textContent = `Shots: ${team.sog}`;
  
  // Assemble team info
  info.appendChild(abbrev);
  info.appendChild(name);
  info.appendChild(stats);
  
  // Assemble team container - this is the key change
  if (isHome) {
    teamContainer.appendChild(info);
    teamContainer.appendChild(logo);
  } else {
    teamContainer.appendChild(logo);
    teamContainer.appendChild(info);
  }
  teamContainer.appendChild(colorAccent);
  
  return teamContainer;
}

// Create center score display
const scoreDisplay = document.createElement('div');
scoreDisplay.className = 'score-display';
scoreDisplay.style.cssText = `
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
`;

// Game status section (period, time)
const gameStatus = document.createElement('div');
gameStatus.className = 'game-status';
gameStatus.style.cssText = `
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 5px;
`;

// Period indicator
const periodIndicator = document.createElement('div');
periodIndicator.className = 'period-indicator';
periodIndicator.textContent = 'Period 3'; // Would need actual period data
periodIndicator.style.cssText = `
  font-size: 14px;
  opacity: 0.8;
`;

// Game clock
const gameClock = document.createElement('div');
gameClock.className = 'game-clock';
gameClock.textContent = '05:23'; // Would need actual time data
gameClock.style.cssText = `
  font-size: 18px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
`;

// Add period and clock to game status
gameStatus.appendChild(periodIndicator);
gameStatus.appendChild(gameClock);

// Scores container
const scoresContainer = document.createElement('div');
scoresContainer.className = 'scores-container';
scoresContainer.style.cssText = `
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 36px;
  font-weight: bold;
`;

// Away team score
const awayScore = document.createElement('div');
awayScore.className = 'team-score away-score';
awayScore.textContent = awayTeam.score;
awayScore.style.cssText = `
  padding: 0 10px;
  min-width: 40px;
  text-align: center;
  color: ${awayTeamColor};
  text-shadow: 0 0 3px rgba(0,0,0,0.5);
`;

// Score separator
const separator = document.createElement('div');
separator.className = 'score-separator';
separator.textContent = '-';
separator.style.cssText = `
  padding: 0 5px;
`;

// Home team score
const homeScore = document.createElement('div');
homeScore.className = 'team-score home-score';
homeScore.textContent = homeTeam.score;
homeScore.style.cssText = `
  padding: 0 10px;
  min-width: 40px;
  text-align: center;
  color: ${homeTeamColor};
  text-shadow: 0 0 3px rgba(0,0,0,0.5);
`;

// Assemble score display
scoresContainer.appendChild(awayScore);
scoresContainer.appendChild(separator);
scoresContainer.appendChild(homeScore);
//scoreDisplay.appendChild(gameStatus);
scoreDisplay.appendChild(scoresContainer);

// Add teams and score to scoreboard
scoreboard.appendChild(createTeamDisplay(awayTeam, false));
scoreboard.appendChild(scoreDisplay);
scoreboard.appendChild(createTeamDisplay(homeTeam, true));

// Create controls container
const controlsContainer = document.createElement('div');
controlsContainer.id = 'controls-container';
controlsContainer.style.cssText = `
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
`;

// Button styling function
function styleButton(button, icon = null) {
  button.style.cssText = `
    background: rgba(30, 30, 30, 0.85);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Arial', sans-serif;
    font-size: 14px;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  `;
  
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = 'rgba(50, 50, 50, 0.95)';
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
  });
  
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = 'rgba(30, 30, 30, 0.85)';
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  });
  
  if (icon) {
    const iconElement = document.createElement('span');
    iconElement.innerHTML = icon;
    iconElement.style.marginRight = '8px';
    button.prepend(iconElement);
  }
  
  return button;
}

// Toggle scoreboard visibility button
const toggleButton = document.createElement('button');
toggleButton.className = 'toggle-scoreboard-btn';
toggleButton.textContent = 'Hide Scoreboard';
styleButton(toggleButton, '&#128065;'); // Eye icon

toggleButton.addEventListener('click', () => {
  if (scoreboard.style.display === 'none') {
    scoreboard.style.display = 'flex';
    toggleButton.innerHTML = '&#128065; Hide Scoreboard';
  } else {
    scoreboard.style.display = 'none';
    toggleButton.innerHTML = '&#128065; Show Scoreboard';
  }
});

// Compact mode toggle button
const compactButton = document.createElement('button');
compactButton.className = 'compact-mode-btn';
compactButton.textContent = 'Compact Mode';
styleButton(compactButton, '&#128469;'); // Minimize icon

let isCompact = false;

compactButton.addEventListener('click', () => {
  isCompact = !isCompact;
  
  if (isCompact) {
    // Switch to compact mode
    scoreboard.style.padding = '8px';
    document.querySelectorAll('.team-logo').forEach(img => {
      img.style.height = '30px';
    });
    document.querySelectorAll('.team-name, .team-stats, .period-indicator').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.team-abbrev').forEach(el => {
      el.style.fontSize = '20px';
    });
    
    compactButton.innerHTML = '&#128470; Detailed Mode'; // Maximize icon
  } else {
    // Switch to detailed mode
    scoreboard.style.padding = '15px';
    document.querySelectorAll('.team-logo').forEach(img => {
      img.style.height = '50px';
    });
    document.querySelectorAll('.team-name, .team-stats, .period-indicator').forEach(el => {
      el.style.display = 'block';
    });
    document.querySelectorAll('.team-abbrev').forEach(el => {
      el.style.fontSize = '28px';
    });
    
    compactButton.innerHTML = '&#128469; Compact Mode'; // Minimize icon
  }
});

// Reset camera button
const resetCameraButton = document.createElement('button');
resetCameraButton.className = 'reset-camera-btn';
resetCameraButton.textContent = 'Reset Camera';
styleButton(resetCameraButton, '&#128247;'); // Camera icon

resetCameraButton.addEventListener('click', () => {
  // Reset camera to default position
  camera.position.set(0, -75, 75);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 0, 1);
  controls.update();
});

// Help/Legend button and panel
const helpButton = document.createElement('button');
helpButton.className = 'help-btn';
//helpButton.textContent = 'Show Legend';
helpButton.textContent = 'Hide Legend';
styleButton(helpButton, '&#10006;'); // Info icon

let legendVisible = true;
const legend = document.createElement('div');
legend.id = 'event-legend';
legend.style.cssText = `
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(20, 20, 20, 0.85);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  max-width: 300px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  display: block;
  pointer-events: auto;
`;

//legend.innerHTML = `
//  <h3 style="margin-top: 0;">Event Legend</h3>
//  <ul style="padding-left: 20px; margin-bottom: 0;">
//    <li><span style="display: inline-block; width: 12px; height: 12px; background-color: #ff1111; border-radius: 50%; margin-right: 8px;"></span> Goal (large point)</li>
//    <li><span style="display: inline-block; width: 10px; height: 10px; background-color: #ff1111; border-radius: 50%; margin-right: 8px; opacity: 0.8;"></span> Shot on Goal (medium point)</li>
//    <li><span style="display: inline-block; width: 8px; height: 8px; background-color: #ff1111; border-radius: 50%; margin-right: 8px; opacity: 0.6;"></span> Missed Shot (small point)</li>
//    <li><span style="display: inline-block; width: 4px; height: 4px; background-color: #ff1111; border-radius: 50%; margin-right: 8px; opacity: 0.4;"></span> Other Event (tiny point)</li>
//  </ul>
//  </ul>
//`;

legend.innerHTML = `
  <h3 style="margin-top: 0;">Event Legend</h3>
  <ul style="padding-left: 20px; margin-bottom: 0;">
    <li><span style="display: inline-block; width: 12px; height: 12px; background-color: ${homeTeamColor}; border-radius: 50%; margin-right: 8px;"></span> Goal (large point)</li>
    <li><span style="display: inline-block; width: 10px; height: 10px; background-color: ${homeTeamColor}; border-radius: 50%; margin-right: 8px; opacity: 0.8;"></span> Shot on Goal (medium point)</li>
    <li><span style="display: inline-block; width: 8px; height: 8px; background-color: ${homeTeamColor}; border-radius: 50%; margin-right: 8px; opacity: 0.6;"></span> Missed Shot (small point)</li>
    <li><span style="display: inline-block; width: 4px; height: 4px; background-color: ${homeTeamColor}; border-radius: 50%; margin-right: 8px; opacity: 0.4;"></span> Other Event (tiny point)</li>
  </ul>
  </ul>
`;

helpButton.addEventListener('click', () => {
  legendVisible = !legendVisible;
  legend.style.display = legendVisible ? 'block' : 'none';
  helpButton.innerHTML = legendVisible ? '&#10006; Hide Legend' : '&#8505; Show Legend';
});

// Append buttons to controls container
controlsContainer.appendChild(toggleButton);
controlsContainer.appendChild(compactButton);
controlsContainer.appendChild(resetCameraButton);
controlsContainer.appendChild(helpButton);

// Add responsive design handling
function adjustForScreenSize() {
  if (window.innerWidth < 600) {
    scoreboard.style.flexDirection = 'column';
    scoreboard.style.gap = '15px';
    document.querySelectorAll('.home-team, .away-team').forEach(div => {
      div.style.width = '100%';
    });
    
    // Switch to compact mode automatically on small screens
    if (!isCompact) {
      compactButton.click();
    }
  } else {
    scoreboard.style.flexDirection = 'row';
    scoreboard.style.gap = '0';
    document.querySelectorAll('.home-team, .away-team').forEach(div => {
      div.style.width = '45%';
    });
  }
}

// Listen for window resize events
window.addEventListener('resize', adjustForScreenSize);

// Append elements to DOM
hudContainer.appendChild(scoreboard);
hudContainer.appendChild(controlsContainer);
hudContainer.appendChild(legend);
document.body.appendChild(hudContainer);

// Ensure Three.js canvas is below the HUD
//document.querySelector('canvas').style.zIndex = '1';

// Initial screen size adjustment
adjustForScreenSize();
