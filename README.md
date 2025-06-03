# TR*MP TRAIN

TR*MP TRAIN is a retro style snake-like browser game presented in the spirit of parody. Collect assets, employ workers and avoid lawsuits as your corporation grows from humble beginnings to the highest office.

## Playing the Game

1. **Start the Game**
   - Click **Start Game** on the main screen.
   - Choose your desired difficulty: **Fake News (Easy)**, **Tremendous (Normal)**, or **Bigly (Hard)**.

2. **Controls**
   - **Desktop:** Use the arrow keys or WASD to move. Press **Space** to pause.
   - **Mobile:** Swipe on the game board or use the on-screen d-pad.
   - Hold a direction to move continuously at double speed.

3. **Objectives**
   - Collect gold **Assets** ($) to extend your corporate train and earn capital.
   - Grab **Workers** (tie icon) to boost asset values.
   - Exploit **Communities** (people icon) for a burst of capital but watch crisis rise.
   - Dodge red **Lawsuits** (gavel icon). Hitting one ends the game.
   - Keep an eye out for the blue **Twitter Storm** (bird icon) power-up which grants a random bonus.

4. **Phases and Levels**
   - Each bankruptcy advances you to a new level with a new landmark and additional challenges.
   - Inequality and crisis rise as you play. Crisis affects the speed of your train – max crisis doubles the speed.
   - Survive through eight levels, culminating in two presidential terms.

5. **Winning and Losing**
   - Crashing into a wall, yourself or a lawsuit results in game over.
   - Your final score is based on the capital accumulated.

## Detailed Gameplay Mechanics

### Resource System

**Capital Formation**
- Base asset value: 5 units × economic cycle multiplier
- Worker bonus: +1 per 1,000 workers employed
- Economic cycles affect all income (Growth: 1.0x, Recovery: 0.8x, Recession: 0.7x, Depression: 0.4x)
- Community exploitation provides 15 units × economic cycle but increases inequality and crisis

**Workforce Management**
- Each worker adds 1,000 to your workforce counter
- Workers provide a bonus to asset collection (+1 per 1,000 workers)
- During recessions, 10% of workforce is laid off
- During depressions, 20% of workforce is laid off
- Layoffs are tracked separately and persist throughout the game

### Inequality and Crisis System

**Inequality Progression**
- Starts at 0% and can range from -100% to +100%
- Normal asset collection: +2% inequality per asset
- Levels 5-6 (pre-presidency): +8% inequality per asset (accelerated rise)
- Levels 7-8 (presidency): -15% inequality per asset (drains during presidency)
- Community exploitation: +10% inequality per community
- High inequality (>60%) increases crisis level over time

**Crisis Mechanics**
- Crisis level ranges from 0% to 100%
- Automatically increases when inequality exceeds 60%
- Community exploitation adds +15% crisis per community
- Crisis affects game speed: 1% speed increase per 10% crisis level
- At 100% crisis, game speed doubles (runs at 50% of normal interval)
- Crisis warnings appear at 80%+ crisis level

### Economic Phases

The game cycles through four economic phases based on crisis level:

1. **Growth** (Crisis < 30%): Normal multiplier (1.0x)
2. **Recovery** (Crisis 30-40% from Recession): Reduced multiplier (0.8x)
3. **Recession** (Crisis 40-60%): Lower multiplier (0.7x), 10% workforce reduction
4. **Depression** (Crisis > 80%): Lowest multiplier (0.4x), 20% workforce reduction

### Level Progression and Bankruptcy System

**Level Structure**
- 8 levels total, each representing a business bankruptcy
- Assets required per level: 5, 8, 12, 16, 20, 25, 35, 50
- Multiple assets spawn per level (equal to current level number)
- Resources scale with level difficulty

**Business Bankruptcies**
1. **Taj Mahal** (5 assets) - "You've bankrupted the Taj Mahal! But you'll be back 'bigger than ever'!"
2. **Casino** (8 assets) - "Casino bankruptcy! Blame the economy, not your decisions."
3. **Plaza Hotel** (12 assets) - "Plaza Hotel collapse. Another business failure."
4. **Hotel** (16 assets) - "Hotel bankruptcy! You're getting good at this."
5. **Resorts** (20 assets) - "Tr*mp Resorts fails spectacularly."
6. **Entertainment** (25 assets) - "Tr*mp Entertainment down! You've qualified to run for president!"
7. **Presidency 1** (35 assets) - "SECRET LEVEL: Presidential Failure #1 - January 6th coup attempt!"
8. **Presidency 2** (50 assets) - "SECRET LEVEL: Presidential Failure #2 - Total meltdown mode!"

**Special Level Effects**
- **Level 7**: Adds 5 additional lawsuits, changes corporation color to red, enables insurrection mode
- **Level 8**: Enables invincibility mode (can pass through walls and regulations), full meltdown visual effects

### Regulation (Lawsuit) System

**Lawsuit Generation**
- Number of lawsuits scales with difficulty and level
- Fake News (Easy): Always 1 lawsuit
- Tremendous (Normal): 1 + current level lawsuits
- Bigly (Hard): 3 + current level lawsuits
- Community exploitation has 50% chance to spawn additional lawsuit (Normal/Hard only)

**Lawsuit Mechanics**
- Represented by red gavel icons on the game board
- Instant game over when touched (unless invincible in Level 8)
- Randomly positioned, avoiding occupied spaces
- Persist between levels and accumulate over time

### Twitter Storm Power-Up System

**Spawn Mechanics**
- 15% chance to spawn every 5 seconds during gameplay
- Appears as pulsating blue bird icon
- Auto-expires after 15 seconds if not collected
- Cannot spawn if one already exists or effect is active

**Twitter Storm Effects**
1. **TAX BREAK** (10s): Double capital from assets
2. **FAKE NEWS** (8s): Temporary invincibility mode
3. **RALLY TIME** (10s): Slows game speed by 80%
4. **LOYAL BASE** (Instant): Adds 3 segments without penalty
5. **EXECUTIVE ORDER** (Instant): Clears all lawsuits
6. **TWITTER FLURRY** (Instant): Gain 2 capital per snake segment
7. **TV APPEARANCE** (15s): Communities worth more (effect handled in collection)

### Display and Visual System

**Snake Visualization**
- Head displays "$" symbol
- Body segments show capital digits
- Suffix (M/B/T) appears on additional segments
- Color evolves from gold to orange based on level and spray tan intensity
- Alpha fading on tail segments for visual depth

**Capital Formatting**
- Under 1,000: Display as "XM" (millions)
- 1,000-999,999: Display as "XB" (billions) 
- 1,000,000+: Display as "XT" (trillions)

**Status Indicators**
- Real-time inequality and crisis meters with percentage displays
- Economic phase indicators affect visual styling
- News ticker with contextual headlines based on game state
- Pause screen with comprehensive game guide

### Mobile Optimization

**Touch Controls**
- On-screen d-pad for directional movement
- Dedicated pause button
- Swipe gestures on game canvas
- Double-tap to pause functionality
- Haptic feedback support (when available)

**Responsive Design**
- Adaptive canvas sizing
- Mobile-optimized UI layouts
- Touch-friendly button sizing (44px minimum)
- Orientation support with maintained aspect ratio

## Difficulty

Difficulty adjusts starting speed and how many lawsuits appear:

| Setting | Speed | Lawsuits | Speed Scaling |
|---------|-------|----------|---------------|
| Fake News (Easy) | 120ms | Always 1 | Crisis scaling only |
| Tremendous (Normal) | 90ms | 1 + level | Crisis + level scaling |
| Bigly (Hard) | 60ms | 3 + level | Crisis + level scaling |

Higher crisis levels will accelerate gameplay further, with maximum crisis doubling the speed.

## Technical Features

**Performance Optimization**
- Adaptive frame rate monitoring
- Efficient collision detection
- Memory-managed visual effects
- Optimized canvas rendering

**Game State Management**
- Pause/resume functionality with state preservation
- Game state saving for session continuity
- Settings persistence in localStorage
- High score tracking

**Cross-Platform Compatibility**
- Modern browser support (ES6+)
- Mobile touch interface
- Responsive design for various screen sizes
- FontAwesome integration for consistent iconography

## Deployment

The repository includes a simple Docker setup using Nginx:

```bash
# Build and run with Docker Compose
docker-compose up

# Access the game at http://localhost:8080
```

For manual deployment, serve the files from any web server - no backend required.

## Development

**File Structure**
```
├── index.html          # Main game page
├── css/
│   ├── base.css        # Core styles and variables
│   ├── components.css  # UI component styles
│   └── layout.css      # Layout and responsive design
├── js/
│   ├── game.js         # Core game logic
│   ├── controls.js     # Input handling
│   └── twitter-storm.js # Power-up system
├── README.md           # This file
├── LICENSE.txt         # MIT License
├── dockerfile          # Docker configuration
└── docker-compose.yml  # Docker Compose setup
```

**Key Game Variables**
- `corporation[]`: Snake segments with x,y coordinates
- `capital`: Current wealth value
- `inequalityLevel`: -100 to +100 inequality percentage
- `crisisLevel`: 0 to 100 crisis percentage
- `currentLevel`: 1-8 bankruptcy level
- `gameSpeed`: Current game tick interval (ms)

## License

See [LICENSE.txt](LICENSE.txt) for license information. This project is provided in the spirit of satire; no real person is endorsed or disparaged.

---

*"The game features multiple bankruptcies, lawsuits, and questionable business practices - just like in real life!"*