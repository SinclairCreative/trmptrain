/****************************
 * TR*MP TRAIN - Snake Game
 ****************************/

// =============================================
// 1. DOM ELEMENTS & CONSTANTS
// =============================================
let canvas, ctx;

// Initialize canvas after DOM is loaded
function initCanvas() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return false;
    }
    ctx = canvas.getContext('2d');
    canvas.width = 650;
    canvas.height = 650;
    return true;
}

// UI Elements - Use safe getters
const getElement = (id) => document.getElementById(id) || { textContent: '', style: {}, classList: { add: () => {}, remove: () => {} } };

// Game constants
const PHASE = {
    GROWTH: 'campaign',
    RECESSION: 'scandal',
    DEPRESSION: 'bankruptcy',
    RECOVERY: 'comeback'
};

// =============================================
// 2. GAME SETTINGS & STATE VARIABLES
// =============================================

// Canvas settings
let gridSize = 23;
const tileCount = 28;

// Difficulty settings with integrated speeds and lawsuit counts
const difficultySettings = [
    { name: 'FAKE NEWS (EASY)', baseSpeed: 120, baseRegulations: 1, increment: 0 },
    { name: 'TREMENDOUS (NORMAL)', baseSpeed: 90,  baseRegulations: 1, increment: 1 },
    { name: 'BIGLY (HARD)', baseSpeed: 60,  baseRegulations: 3, increment: 1 }
];

let currentDifficulty = 1; // Default to Tremendous
let gameBaseSpeed = difficultySettings[currentDifficulty].baseSpeed;
let maxRegulations = difficultySettings[currentDifficulty].baseRegulations;
let soundEnabled = true;
let soundVolume = 0.2;
let gameSpeed = gameBaseSpeed;

// Game state
let gameRunning = false;
let gamePaused = false;
let gameInterval;
let gameTickCount = 0;
let invincibilityMode = false;
let currentPhase = PHASE.GROWTH;
let boostMode = false;
let boostTickCounter = 0;

// User settings
let autoPauseEnabled = false;
let hapticEnabled = true;

// Score and resources
let capital = 0;
let workforce = 0;
let layoffs = 0;
let highScore = localStorage.getItem('capitalHighScore') || 0;
let economicCycle = 1;
let assetsConsumed = 0;
let laborConsumed = 0;
let communitiesConsumed = 0;
let assetsForNextCycle = 5;
let inequalityLevel = 0;
let crisisLevel = 0;
let crisisWarnings = 0;

// Game objects
let corporation = [];
let assets = {};
let labor = null;
let community = null;
let regulations = [];
let velocityX = 0;
let velocityY = 0;
let lastDirection = { x: 0, y: 0 };
let capitalTexts = [];

// Level system
let currentLevel = 1;
const maxLevel = 8;

// Multiple resources
let allAssets = [];
let allLabor = [];
let allCommunities = [];

// Additional features
let sprayTanIntensity = 'NORMAL';
let speedrunMode = false;
let darkMode = false;
let newsUpdateInterval;

// Direction change control
window.lastDirectionChange = Date.now();
window.DIRECTION_CHANGE_DELAY = 0;

// Add this variable at the top with other variables to support the game state saving
let savedGameState = null;

// =============================================
// 3. GAME CONTENT & ASSETS
// =============================================

// Level features
const levelFeatures = [
  { level: 1, assetsRequired: 5, name: "Taj Mahal" },
  { level: 2, assetsRequired: 8, name: "Casino" },
  { level: 3, assetsRequired: 12, name: "Plaza" },
  { level: 4, assetsRequired: 16, name: "Hotel" },
  { level: 5, assetsRequired: 20, name: "Resorts" },
  { level: 6, assetsRequired: 25, name: "Entertainment" },
  { level: 7, assetsRequired: 35, name: "Presidency 1" },
  { level: 8, assetsRequired: 50, name: "Presidency 2" }
];

// Level descriptions
const levelDescriptions = [
    "",
    "You've bankrupted the Taj Mahal! But you'll be back 'bigger than ever'!",
    "Casino bankruptcy! Blame the economy, not your decisions.",
    "Plaza Hotel collapse. Another business failure.",
    "Hotel bankruptcy! You're getting good at this.",
    "Tr*mp Resorts fails spectacularly.",
    "Tr*mp Entertainment down! You've qualified to run for president!",
    "SECRET LEVEL: Presidential Failure #1 - January 6th coup attempt!",
    "SECRET LEVEL: Presidential Failure #2 - Total meltdown mode!"
];

// News headlines
const newsHeadlines = {
  growth: [
    "Tr*mp announces 'biggest deal ever' with no details",
    "Gold-plated properties mask mounting debts",
    "New tax loopholes benefit real estate moguls"
  ],
  workforce: [
    "Tr*mp hotels accused of underpaying staff",
    "Contractors report non-payment for completed work",
    "Foreign workers brought in as Americans deemed 'too expensive'"
  ],
  recession: [
    "Tr*mp Casino files for Chapter 11... again",
    "Banks refuse to lend after multiple defaults",
    "Deutsche Bank only lender willing to take risk on Tr*mp"
  ],
  inequality: [
    "Tr*mp caught bragging about not paying taxes",
    "Workers fired while executive bonuses rise",
    "Gold toilets installed as worker wages frozen"
  ],
  regulation: [
    "Tr*mp Organization under investigation for fraud",
    "New York AG files lawsuit over business practices",
    "Judge fines Tr*mp for contempt of court"
  ]
};

// Sound placeholders
const assetSound = { play: function() {}, currentTime: 0 };
const gameOverSound = { play: function() {}, currentTime: 0 };
const levelUpSound = { play: function() {}, currentTime: 0 };

// =============================================
// 4. GAME INITIALIZATION & CORE FUNCTIONS
// =============================================

// Clean up event listeners
function setupEventListeners() {
    const buttons = [
        { id: 'start-btn', handler: startGame },
        { id: 'play-again-btn', handler: startGame },
        { id: 'resume-game-btn', handler: () => startGameFromSaved() },
        { id: 'menu-btn', handler: () => {
            getElement('game-over-screen').classList.remove('active');
            getElement('start-screen').classList.add('active');
        }},
        { id: 'settings-btn', handler: () => {
            getElement('start-screen').classList.remove('active');
            getElement('settings-screen').classList.add('active');
        }},
        { id: 'back-btn', handler: () => {
            getElement('settings-screen').classList.remove('active');
            getElement('start-screen').classList.add('active');
        }},
        { id: 'continue-btn', handler: () => {
            getElement('level-up-screen').classList.remove('active');
            startNextLevel();
        }},
        { id: 'difficulty-btn', handler: () => {
            currentDifficulty = (currentDifficulty + 1) % difficultySettings.length;
            setDifficulty(currentDifficulty);
        }},
        { id: 'sound-btn', handler: () => {
            soundEnabled = !soundEnabled;
            const btn = getElement('sound-btn');
            if (btn) btn.textContent = `SOUND: ${soundEnabled ? 'ON' : 'OFF'}`;
        }},
        { id: 'auto-pause-btn', handler: () => {
            autoPauseEnabled = !autoPauseEnabled;
            const btn = getElement('auto-pause-btn');
            if (btn) btn.textContent = `AUTO-PAUSE: ${autoPauseEnabled ? 'ON' : 'OFF'}`;
        }},
        { id: 'haptic-btn', handler: () => {
            hapticEnabled = !hapticEnabled;
            const btn = getElement('haptic-btn');
            if (btn) btn.textContent = `HAPTIC: ${hapticEnabled ? 'ON' : 'OFF'}`;
        }},
        { id: 'color-btn', handler: () => {
            const options = ['NORMAL', 'EXTRA', 'MAXIMUM'];
            const currentIndex = options.indexOf(sprayTanIntensity);
            sprayTanIntensity = options[(currentIndex + 1) % options.length];
            const btn = getElement('color-btn');
            if (btn) btn.textContent = `SPRAY TAN: ${sprayTanIntensity}`;
        }},
        { id: 'floating-fullscreen-btn', handler: toggleFullscreen }
    ];

    buttons.forEach(({ id, handler }) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    });
    // No speed slider; speed tied to difficulty
}

// Set difficulty level
function setDifficulty(level) {
    currentDifficulty = level;
    const setting = difficultySettings[currentDifficulty];
    gameBaseSpeed = setting.baseSpeed;
    updateMaxRegulations();

    const difficultyBtn = getElement('difficulty-btn');
    if (difficultyBtn) {
        difficultyBtn.textContent = `DIFFICULTY: ${setting.name}`;
    }

    updateGameSpeed();

    console.log(`Difficulty set to: ${setting.name}`);
}

// Initialize the game
function init() {
    if (!initCanvas()) return;

    setDifficulty(currentDifficulty);
    clearCapitalTexts();
    createGameStyles();
    setupEventListeners();
    exposeGameAPI();

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    console.log("Game initialized successfully!");
}

// Start the game
function startGame() {
    try {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));

        // Initialize game state
        capital = 1;
        workforce = 0;
        layoffs = 0;
        economicCycle = 1;
        assetsConsumed = 0;
        inequalityLevel = 0;
        crisisLevel = 0;
        regulations = [];
        currentPhase = PHASE.GROWTH;
        crisisWarnings = 0;
        gameTickCount = 0;
        currentLevel = 1;
        invincibilityMode = false;
        gamePaused = false;
        boostMode = false;
        boostTickCounter = 0;
        assetsForNextCycle = levelFeatures[0].assetsRequired;

        // Clear visual effects
        document.body.classList.remove('level-7', 'level-8');
        clearCapitalTexts();

        // Initialize game objects
        corporation = [{ x: Math.floor(tileCount/2), y: Math.floor(tileCount/2) }];
        velocityX = 0;
        velocityY = 0;
        lastDirection = { x: 0, y: 0 };

        // Clear and initialize resources
        allAssets = [];
        allLabor = [];
        allCommunities = [];
        placeAsset();
        updateMaxRegulations();
        fillRegulations();

        // Update display
        updateStatDisplay();
        startNewsTicker();

        // Show/hide UI elements
        const header = document.querySelector('header');
        const statsPanel = document.querySelector('.stats-panel');
        if (header) header.style.display = 'none';
        if (statsPanel) statsPanel.style.display = 'flex';

        // Base speed derived from difficulty
        updateGameSpeed();

        // Set gameRunning flag BEFORE starting interval
        gameRunning = true;

        // Start game loop
        clearInterval(gameInterval);
        setTimeout(() => {
            if (gameRunning) {
                gameInterval = setInterval(gameLoop, gameSpeed);
                console.log("Game loop started with interval:", gameSpeed);
                draw();
            }
        }, 100);

        console.log("Game started successfully!");

    } catch (err) {
        console.error("Error starting game:", err);
    }
}

// Performance monitoring
let frameCount = 0;
let lastFPSUpdate = Date.now();
let currentFPS = 60;

function updatePerformanceStats() {
    frameCount++;
    const now = Date.now();

    if (now - lastFPSUpdate >= 1000) {
        currentFPS = frameCount;
        frameCount = 0;
        lastFPSUpdate = now;

        if (currentFPS < 30 && gameSpeed > 100) {
            gameSpeed += 20;
        }
    }
}

// Main game loop
function gameLoop() {
    try {
        if (!gameRunning || gamePaused) {
            return;
        }

        updatePerformanceStats();
        gameTickCount++;

        // Handle boost mode timing
        if (boostMode) {
            boostTickCounter++;
            if (boostTickCounter % 1 === 0) {
                moveSnake();
            }
        } else {
            boostTickCounter = 0;
            moveSnake();
        }

        if (gameTickCount % 100 === 0) {
            handlePeriodicEffects();
        }

        checkLevelProgression();
        updateStatDisplay();
        checkEconomicPhaseEffects();

        updateGameStateIndicators();
        draw();
    } catch (error) {
        console.error("Error in game loop:", error);
    }
}

// Separate movement logic
function moveSnake() {
    if (velocityX !== 0 || velocityY !== 0) {
        lastDirection.x = velocityX;
        lastDirection.y = velocityY;
    }

    let head = { x: corporation[0].x + velocityX, y: corporation[0].y + velocityY };

    // Check boundaries
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        if (invincibilityMode) {
            if (head.x < 0) head.x = tileCount - 1;
            if (head.y < 0) head.y = tileCount - 1;
            if (head.x >= tileCount) head.x = 0;
            if (head.y >= tileCount) head.y = 0;
        } else {
            gameOver();
            return;
        }
    }

    // Check collisions
    if (checkCollision(head) || checkRegulationCollision(head)) {
        if (!invincibilityMode) {
            gameOver();
            return;
        }
    }

    corporation.unshift(head);

    let consumedResource = handleResourceConsumption(head);

    if (!consumedResource) {
        corporation.pop();
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    clearInterval(gameInterval);
    clearInterval(newsUpdateInterval);

    document.querySelector('header').style.display = 'block';
    document.querySelector('.stats-panel').style.display = 'none';

    if (capital > highScore) {
        highScore = capital;
        localStorage.setItem('capitalHighScore', highScore);
    }

    const gameOverMessage = getElement('game-over-message');
    const gameOverScore = getElement('game-over-score');
    const gameOverStats = getElement('game-over-stats');

    gameOverMessage.textContent = "Your empire has collapsed!";
    gameOverScore.textContent = formatCapital(capital);
    gameOverStats.innerHTML = `Level Reached: ${currentLevel}<br>Assets: ${assetsConsumed}`;

    getElement('game-over-screen').classList.add('active');

    if (soundEnabled) {
        playSound(gameOverSound);
    }
}

// Toggle pause with enhanced functionality
function togglePause() {
    if (gamePaused) {
        gamePaused = false;
        // Check if snake is too close to walls when unpausing
        moveSnakeAwayFromWalls();

        // Add countdown when unpausing
        showCountdown(3, () => {
            if (gameRunning) {
                gameInterval = setInterval(gameLoop, gameSpeed);
            }
        });
        hidePauseIndicator();
    } else {
        gamePaused = true;
        clearInterval(gameInterval);
        showPauseIndicator();
    }
}

// Add game state indicators
function updateGameStateIndicators() {
    let indicator = document.getElementById('game-state-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'game-state-indicator';
        indicator.className = 'game-state-indicator';
        document.getElementById('game-container').appendChild(indicator);
    }

    if (gamePaused) {
        indicator.className = 'game-state-indicator paused';
        indicator.textContent = 'PAUSED';
    } else if (boostMode) {
        indicator.className = 'game-state-indicator boost';
        indicator.innerHTML = '<i class="fas fa-bolt"></i> BOOST';
    } else {
        indicator.style.display = 'none';
    }
}

// =============================================
// 5. RESOURCE MANAGEMENT
// =============================================

function handleResourceConsumption(head) {
    // Check Twitter Storm first
    if (typeof checkTwitterStormCollision === 'function' && checkTwitterStormCollision(head)) {
        return true;
    }

    // Check all assets
    for (let i = 0; i < allAssets.length; i++) {
        if (head.x === allAssets[i].x && head.y === allAssets[i].y) {
            const workerBonus = Math.floor(workforce / 1000);
            capital += 5 * economicCycle + workerBonus;
            assetsConsumed++;
            inequalityLevel = Math.min(inequalityLevel + 2, 100);

            createEnhancedConsumptionEffect(
                allAssets[i].x * gridSize + gridSize/2, 
                allAssets[i].y * gridSize + gridSize/2, 
                getComputedStyle(document.documentElement).getPropertyValue('--wealth').trim(),
                Math.floor(5 * economicCycle + workerBonus)
            );

            allAssets.splice(i, 1);
            placeAsset();

            if (allLabor.length < currentLevel && Math.random() > 0.6) {
                setTimeout(() => placeLabor(), 2000);
            }

            if (allCommunities.length < currentLevel && Math.random() > 0.8) {
                setTimeout(() => placeCommunity(), 3000);
            }

            checkLevelProgression();
            return true;
        }
    }

    // Check all labor positions
    for (let i = 0; i < allLabor.length; i++) {
        if (head.x === allLabor[i].x && head.y === allLabor[i].y) {
            workforce += 1000;
            laborConsumed++;

            createConsumptionEffect(allLabor[i].x * gridSize + gridSize/2, allLabor[i].y * gridSize + gridSize/2, 'var(--worker)');
            allLabor.splice(i, 1);

            if (Math.random() > 0.4) {
                setTimeout(() => placeLabor(), 3000);
            }

            return true;
        }
    }

    // Check all community positions
    for (let i = 0; i < allCommunities.length; i++) {
        if (head.x === allCommunities[i].x && head.y === allCommunities[i].y) {
            capital += 15 * economicCycle;
            communitiesConsumed++;
            inequalityLevel = Math.min(inequalityLevel + 10, 100);
            crisisLevel = Math.min(crisisLevel + 15, 100);

            createConsumptionEffect(allCommunities[i].x * gridSize + gridSize/2, allCommunities[i].y * gridSize + gridSize/2, 'var(--people)');
            allCommunities.splice(i, 1);

            if (currentDifficulty > 0 && Math.random() > 0.5) {
                addRegulation();
            }

            return true;
        }
    }

    return false;
}

// Place resources
function placeAsset() {
    if (gameTickCount === 0) allAssets = [];

    const assetsToPlace = currentLevel;

    while (allAssets.length < assetsToPlace) {
        let asset = createRandomPosition();
        let attempts = 0;

        while (isPositionOccupied(asset) && attempts < 100) {
            attempts++;
            asset = createRandomPosition();
        }

        if (attempts < 100) {
            allAssets.push(asset);
        } else {
            break;
        }
    }

    assets = allAssets[0] || createRandomPosition();
}

function placeLabor() {
    if (allLabor.length >= currentLevel) return;

    while (allLabor.length < currentLevel) {
        let laborPos = createRandomPosition();
        let attempts = 0;

        while (isPositionOccupied(laborPos) && attempts < 100) {
            attempts++;
            laborPos = createRandomPosition();
        }

        if (attempts < 100) {
            allLabor.push(laborPos);
        } else {
            break;
        }
    }

    labor = allLabor[0] || null;
}

function placeCommunity() {
    if (allCommunities.length >= currentLevel) return;

    while (allCommunities.length < currentLevel) {
        let communityPos = createRandomPosition();
        let attempts = 0;

        while (isPositionOccupied(communityPos) && attempts < 100) {
            attempts++;
            communityPos = createRandomPosition();
        }

        if (attempts < 100) {
            allCommunities.push(communityPos);
        } else {
            break;
        }
    }

    community = allCommunities[0] || null;
}

function addRegulation() {
    if (regulations.length >= maxRegulations) return;

    let regulation = createRandomPosition();

    while (isPositionOccupied(regulation)) {
        regulation = createRandomPosition();
    }

    regulations.push(regulation);
}

function createRandomPosition() {
    return {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
}

// =============================================
// 6. LEVEL SYSTEM
// =============================================

function checkLevelProgression() {
    if (assetsConsumed >= assetsForNextCycle && currentLevel < maxLevel) {
        const nextLevelIndex = currentLevel;
        if (nextLevelIndex < levelFeatures.length) {
            assetsForNextCycle = levelFeatures[nextLevelIndex].assetsRequired;
        }
        levelUp(currentLevel + 1);
    }
}

function levelUp(newLevel) {
    gameRunning = false;
    clearInterval(gameInterval);

    if (newLevel < 1 || newLevel > maxLevel) {
        console.warn(`Invalid level: ${newLevel}`);
        gameRunning = true;
        gameInterval = setInterval(gameLoop, gameSpeed);
        return;
    }

    currentLevel = newLevel;
    getElement('level').textContent = currentLevel;

    const bankruptcyNumber = document.getElementById('bankruptcy-number');
    if (bankruptcyNumber) {
        bankruptcyNumber.textContent = currentLevel - 1;
    }

    const levelDescription = document.getElementById('level-description');
    if (levelDescription) {
        levelDescription.textContent = levelDescriptions[currentLevel - 1] || "You've bankrupted another business!";
    }

    const newLevelElement = document.getElementById('new-level');
    if (newLevelElement) {
        const levelFeature = levelFeatures[currentLevel - 2];
        newLevelElement.textContent = levelFeature ? levelFeature.name : "";
    }

    getElement('level-up-screen').classList.add('active');

    if (soundEnabled) {
        playSound(levelUpSound);
    }
}

function startNextLevel() {
    getElement('level-up-screen').classList.remove('active');

    // Move snake away from walls before starting level
    moveSnakeAwayFromWalls();

    if (currentLevel === 7) {
        for (let i = 0; i < 5; i++) {
            addRegulation();
        }
        document.documentElement.style.setProperty('--corp-color', '#e63946');
        document.body.classList.add('level-7');
        showMessage("You've incited an insurrection! Beware the lawsuits!");
    } else if (currentLevel === 8) {
        document.documentElement.style.setProperty('--corp-color', '#ff0000');
        document.body.classList.add('level-8');
        invincibilityMode = true;
        showMessage("MELTDOWN MODE! You can't be stopped by walls or regulations!");
    }

    // Reset resources
    allAssets = [];
    allLabor = [];
    allCommunities = [];

    placeAsset();
    placeLabor();
    placeCommunity();

    updateMaxRegulations();
    fillRegulations();

    updateGameSpeed();

    showCountdown(3, () => {
        gameRunning = true;
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    });
}

// =============================================
// 7. DRAWING & RENDERING
// =============================================

function draw() {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawRegulations();
    drawResources();
    drawCorporation();

    // Draw Twitter Storm if it exists
    if (typeof drawTwitterStorm === 'function') {
        drawTwitterStorm();
    }

    if (currentLevel < 8) {
        const progress = assetsConsumed / assetsForNextCycle;

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(0, canvas.height - 5, canvas.width, 5);

        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--corp-color').trim();
        ctx.fillRect(0, canvas.height - 5, canvas.width * progress, 5);
    }

    drawCapitalOnSnake();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
}

function drawRegulations() {
    const regulationColor = getComputedStyle(document.documentElement).getPropertyValue('--regulation').trim() || '#dc3545';

    regulations.forEach(regulation => {
        ctx.fillStyle = regulationColor;
        ctx.beginPath();
        ctx.arc(
            regulation.x * gridSize + gridSize/2,
            regulation.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0, 
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = regulationColor;
        ctx.font = "14px FontAwesome";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\uf0e3", regulation.x * gridSize + gridSize/2, regulation.y * gridSize + gridSize/2);
    });
}

function drawResources() {
    const wealthColor = getComputedStyle(document.documentElement).getPropertyValue('--wealth').trim() || '#28a745';
    const workerColor = getComputedStyle(document.documentElement).getPropertyValue('--worker').trim() || '#007bff';
    const peopleColor = getComputedStyle(document.documentElement).getPropertyValue('--people').trim() || '#6f42c1';

    // Draw all assets
    ctx.fillStyle = wealthColor;
    allAssets.forEach(asset => {
        ctx.beginPath();
        ctx.arc(
            asset.x * gridSize + gridSize/2,
            asset.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0, 
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = wealthColor;
        ctx.font = '14px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uf155', asset.x * gridSize + gridSize/2, asset.y * gridSize + gridSize/2);
    });

    // Draw all labor
    ctx.fillStyle = workerColor;
    allLabor.forEach(laborPos => {
        ctx.beginPath();
        ctx.arc(
            laborPos.x * gridSize + gridSize/2,
            laborPos.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0, 
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = workerColor;
        ctx.font = '14px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uf508', laborPos.x * gridSize + gridSize/2, laborPos.y * gridSize + gridSize/2);
    });

    // Draw all communities
    ctx.fillStyle = peopleColor;
    allCommunities.forEach(communityPos => {
        ctx.beginPath();
        ctx.arc(
            communityPos.x * gridSize + gridSize/2,
            communityPos.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0, 
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = peopleColor;
        ctx.font = '14px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\uf0c0', communityPos.x * gridSize + gridSize/2, communityPos.y * gridSize + gridSize/2);
    });
}

function drawCorporation() {
    const snakeColor = getSnakeColor(currentLevel);

    corporation.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = snakeColor;
            drawRoundedRect(ctx, segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1, 3);
        } else {
            const alpha = 1 - (index / corporation.length * 0.6);
            ctx.fillStyle = snakeColor.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
            drawRoundedRect(ctx, segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1, 1);
        }
    });
}

function drawCapitalOnSnake() {
    clearCapitalTexts();

    if (corporation.length <= 1) return;

    let formattedCapital = formatCapital(capital);
    let numberPart = '';
    let suffix = '';

    if (formattedCapital.includes('M')) {
        numberPart = formattedCapital.substring(0, formattedCapital.indexOf('M'));
        suffix = 'M';
    } else if (formattedCapital.includes('B')) {
        numberPart = formattedCapital.substring(0, formattedCapital.indexOf('B'));
        suffix = 'B';
    } else if (formattedCapital.includes('T')) {
        numberPart = formattedCapital.substring(0, formattedCapital.indexOf('T'));
        suffix = 'T';
    } else {
        numberPart = formattedCapital;
    }

    let numberDigits = numberPart.split('');

    if (corporation.length > 0) {
        createCapitalText('$', corporation[0].x * gridSize + gridSize/2, corporation[0].y * gridSize + gridSize/2);
    }

    let maxDigits = Math.min(numberDigits.length, corporation.length - 1);

    for (let i = 0; i < maxDigits; i++) {
        let segment = corporation[i + 1];
        if (!segment) continue;

        let index = (velocityX > 0 || velocityY > 0) ? numberDigits.length - 1 - i : i;

        if (index >= 0 && index < numberDigits.length) {
            createCapitalText(numberDigits[index], segment.x * gridSize + gridSize/2, segment.y * gridSize + gridSize/2);
        }
    }

    if (maxDigits < corporation.length - 1 && suffix) {
        let segment = corporation[maxDigits + 1];
        if (segment) {
            createCapitalText(suffix, segment.x * gridSize + gridSize/2, segment.y * gridSize + gridSize/2);
        }
    }
}

// =============================================
// 8. UTILITY FUNCTIONS
// =============================================

// Set game speed
function setGameSpeed(speed) {
    if (!speed || typeof speed !== 'number' || speed <= 0) return;

    gameSpeed = speed;

    if (gameRunning && !gamePaused) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, boostMode ? 
            Math.floor(gameSpeed / 2) :
            gameSpeed
        );
    }
}

function updateGameSpeed() {
    const crisisMultiplier = crisisLevel >= 100 ? 0.5 : 1 - (crisisLevel / 1000);
    const newSpeed = Math.max(20, Math.floor(gameBaseSpeed * crisisMultiplier));
    setGameSpeed(newSpeed);
}

function updateMaxRegulations() {
    const setting = difficultySettings[currentDifficulty];
    maxRegulations = setting.baseRegulations + setting.increment * (currentLevel - 1);
}

function fillRegulations() {
    while (regulations.length < maxRegulations) {
        addRegulation();
    }
    if (regulations.length > maxRegulations) {
        regulations = regulations.slice(0, maxRegulations);
    }
}

// Boost mode toggle
window.setBoostMode = function(enabled) { 
    if (boostMode === enabled) return;

    boostMode = enabled;

    if (gameRunning && !gamePaused) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, enabled ? 
            Math.floor(gameSpeed / 2) :
            gameSpeed
        );
    }
};

// Format capital with suffix
function formatCapital(value) {
    if (value < 1000) return Math.floor(value) + 'M';
    if (value < 1000000) return Math.floor(value/1000) + 'B';
    return Math.floor(value/1000000) + 'T';
}

// Function to clear capital texts - moved here before init() calls it
function clearCapitalTexts() {
    capitalTexts.forEach(text => {
        if (text && text.remove) {
            text.remove();
        }
    });
    capitalTexts = [];
}

// Create capital text element with perfect alignment
function createCapitalText(text, x, y) {
    const textElement = document.createElement('div');
    textElement.className = 'capital-text';
    textElement.textContent = text;

    // Use exact positioning relative to game container
    const gameContainer = document.getElementById('game-container');
    const canvas = document.getElementById('game-canvas');

    if (gameContainer && canvas) {
        const containerRect = gameContainer.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        // Calculate offset from container to canvas
        const offsetX = canvasRect.left - containerRect.left;
        const offsetY = canvasRect.top - containerRect.top;

        textElement.style.position = 'absolute';
        textElement.style.left = `${offsetX + x}px`;
        textElement.style.top = `${offsetY + y}px`;
        textElement.style.transform = 'translate(-50%, -50%)';
        textElement.style.zIndex = '10';

        gameContainer.appendChild(textElement);
        capitalTexts.push(textElement);
    }
}

// Draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// Show message
function showMessage(text) {
    const message = document.createElement('div');
    message.className = 'level-message';
    message.textContent = text;

    const container = document.getElementById('game-container');
    if (container) {
        container.appendChild(message);

        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => {
                if (message.parentNode) {
                    message.remove();
                }
            }, 1000);
        }, 3000);
    }
}

function showCountdown(count, callback) {
    if (count <= 0) {
        callback();
        return;
    }

    const message = document.createElement('div');
    message.className = 'countdown-message';
    message.textContent = count;

    const container = document.getElementById('game-container');
    if (container) {
        container.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
            showCountdown(count - 1, callback);
        }, 1000);
    }
}

function showPauseIndicator() {
    let pauseIndicator = document.getElementById('pause-indicator');
    if (!pauseIndicator) {
        pauseIndicator = document.createElement('div');
        pauseIndicator.id = 'pause-indicator';
        pauseIndicator.innerHTML = `
            <div class="pause-title">GAME PAUSED</div>
            
            <div class="pause-instructions">
                <h4 style="color: var(--corp-color); margin-bottom: 10px;">QUICK GUIDE</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; text-align: left;">
                    <div>💰 <strong>Assets:</strong> Collect for capital</div>
                    <div>👷 <strong>Workers:</strong> Boost asset values</div>
                    <div>👥 <strong>Communities:</strong> High value, adds crisis</div>
                    <div>⚖️ <strong>Lawsuits:</strong> Avoid or game over</div>
                </div>
            </div>
            
            <div class="pause-controls">
                <strong>CONTROLS:</strong> WASD/Arrows to move • Space to pause • Hold keys for boost
            </div>
            
            <div class="pause-buttons">
                <button onclick="window.togglePause()">RESUME</button>
                <button id="pause-home-btn">HOME</button>
                <button id="pause-settings-btn">SETTINGS</button>
            </div>
            
            <div class="resume-hint">Press SPACE or double-tap to resume</div>
        `;

        const container = document.getElementById('game-container');
        if (container) {
            container.appendChild(pauseIndicator);

            // Add event listeners for the new buttons
            const homeBtn = pauseIndicator.querySelector('#pause-home-btn');
            const settingsBtn = pauseIndicator.querySelector('#pause-settings-btn');

            if (homeBtn) {
                homeBtn.addEventListener('click', () => {
                    saveGameState();
                    hidePauseIndicator();
                    getElement('start-screen').classList.add('active');

                    const resumeBtn = document.getElementById('resume-game-btn');
                    if (resumeBtn) resumeBtn.style.display = 'inline-block';

                    const header = document.querySelector('header');
                    const statsPanel = document.querySelector('.stats-panel');
                    if (header) header.style.display = 'block';
                    if (statsPanel) statsPanel.style.display = 'none';
                });
            }

            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    saveGameState();
                    hidePauseIndicator();
                    getElement('settings-screen').classList.add('active');
                });
            }
        }
    }
    pauseIndicator.style.display = 'flex';
}

function hidePauseIndicator() {
    const pauseIndicator = document.getElementById('pause-indicator');
    if (pauseIndicator) {
        pauseIndicator.style.display = 'none';
    }
}

function getSnakeColor(level) {
    let startColor = {r: 212, g: 175, b: 55};
    let endColor = {r: 255, g: 140, b: 0};

    const progress = Math.min((level - 1) / 6, 1);

    let orangeMultiplier = 1;
    if (sprayTanIntensity === 'EXTRA') orangeMultiplier = 1.3;
    if (sprayTanIntensity === 'MAXIMUM') orangeMultiplier = 1.6;

    const r = Math.floor(startColor.r + (endColor.r - startColor.r) * progress * orangeMultiplier);
    const g = Math.floor(startColor.g + (endColor.g - startColor.g) * progress);
    const b = Math.floor(startColor.b + (endColor.b - startColor.b) * progress * orangeMultiplier);

    return `rgb(${Math.min(r, 255)}, ${Math.min(g, 255)}, ${Math.min(b, 255)})`;
}

function createConsumptionEffect(x, y, color) {
    const effect = document.createElement('div');
    effect.className = 'consumption-effect';
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    effect.style.width = `${gridSize}px`;
    effect.style.height = `${gridSize}px`;
    effect.style.backgroundColor = color;

    const container = document.getElementById('game-container');
    if (container) {
        container.appendChild(effect);

        setTimeout(() => {
            if (effect.parentNode) {
                effect.remove();
            }
        }, 600);
    }
}

function createEnhancedConsumptionEffect(x, y, color, value) {
    createConsumptionEffect(x, y, color);
}

function updateSpeedLabel(speed) {
    const speedLabel = document.getElementById('speed-value');
    if (speedLabel) {
        speedLabel.textContent = `${speed}ms`;
    }
}

function playSound(sound) {
    if (soundEnabled && sound && typeof sound.play === 'function') {
        sound.currentTime = 0;
        sound.play().catch(e => {});
    }
}

function exposeGameAPI() {
    Object.defineProperty(window, 'gameRunning', { 
        get: () => gameRunning,
        set: (value) => { gameRunning = value; }
    });
    
    Object.defineProperty(window, 'gamePaused', { 
        get: () => gamePaused,
        set: (value) => { gamePaused = value; }
    });
    
    Object.defineProperty(window, 'velocityX', { 
        get: () => velocityX,
        set: (value) => { velocityX = value; }
    });
    
    Object.defineProperty(window, 'velocityY', { 
        get: () => velocityY,
        set: (value) => { velocityY = value; }
    });
    
    window.togglePause = togglePause;
    window.startGame = startGame;
    window.setGameSpeed = setGameSpeed;
    window.createRandomPosition = createRandomPosition;
    window.corporation = corporation;
    window.gridSize = gridSize;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Error attempting to enable fullscreen:', err.message);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function resizeCanvas() {
    if (!canvas || !ctx) return;

    const container = document.getElementById('game-container');
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const availableSize = Math.min(containerWidth, containerHeight);
    gridSize = Math.floor(availableSize / tileCount);

    const canvasSize = gridSize * tileCount;

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = canvasSize + 'px';
    canvas.style.height = canvasSize + 'px';

    console.log(`Canvas resized: ${canvasSize}px, Grid size: ${gridSize}px, Tiles: ${tileCount}`);

    if (gameRunning && !gamePaused) {
        draw();
    }
}

function isPositionOccupied(position) {
    if (!position) return false;

    for (let i = 0; i < corporation.length; i++) {
        if (corporation[i].x === position.x && corporation[i].y === position.y) {
            return true;
        }
    }

    for (let i = 0; i < allAssets.length; i++) {
        if (allAssets[i].x === position.x && allAssets[i].y === position.y) {
            return true;
        }
    }

    for (let i = 0; i < allLabor.length; i++) {
        if (allLabor[i].x === position.x && allLabor[i].y === position.y) {
            return true;
        }
    }

    for (let i = 0; i < allCommunities.length; i++) {
        if (allCommunities[i].x === position.x && allCommunities[i].y === position.y) {
            return true;
        }
    }

    for (let i = 0; i < regulations.length; i++) {
        if (regulations[i].x === position.x && regulations[i].y === position.y) {
            return true;
        }
    }

    if (typeof twitterStorm !== 'undefined' && twitterStorm) {
        if (twitterStorm.x === position.x && twitterStorm.y === position.y) {
            return true;
        }
    }

    return false;
}

function checkCollision(position) {
    for (let i = 1; i < corporation.length; i++) {
        if (corporation[i].x === position.x && corporation[i].y === position.y) {
            return true;
        }
    }
    return false;
}

function checkRegulationCollision(position) {
    for (let i = 0; i < regulations.length; i++) {
        if (regulations[i].x === position.x && regulations[i].y === position.y) {
            return true;
        }
    }
    return false;
}

function handlePeriodicEffects() {
    // Update crisis level based on inequality
    if (inequalityLevel > 60 && Math.random() > 0.7) {
        crisisLevel = Math.min(crisisLevel + 5, 100);

        if (crisisLevel > 80 && crisisWarnings < 3) {
            showCrisisWarning();
            crisisWarnings++;
        }
    }

    // Chance to add regulation based on difficulty
    if (currentDifficulty > 0 && Math.random() < (window.regulationFrequency || 0.3) / 10) {
        addRegulation();
    }

    // Update news headlines
    if (Math.random() > 0.7) {
        updateNewsHeadline();
    }
}

function updateNewsHeadline() {
    // Select category based on game state
    let category;
    if (inequalityLevel > 70) {
        category = 'inequality';
    } else if (workforce > 10000) {
        category = 'workforce';
    } else if (regulations.length > 5) {
        category = 'regulation';
    } else if (currentPhase === PHASE.RECESSION) {
        category = 'recession';
    } else {
        category = 'growth';
    }

    // Get random headline from category
    if (newsHeadlines[category] && newsHeadlines[category].length > 0) {
        const randomIndex = Math.floor(Math.random() * newsHeadlines[category].length);
        const headline = newsHeadlines[category][randomIndex];

        const newsElement = document.querySelector('.news-headline');
        if (newsElement) {
            newsElement.textContent = headline;
        }
    }
}

function startNewsTicker() {
    // Clear any existing interval
    if (newsUpdateInterval) {
        clearInterval(newsUpdateInterval);
    }

    updateNewsHeadline();

    // Update periodically
    newsUpdateInterval = setInterval(() => {
        if (gameRunning && !gamePaused && Math.random() > 0.5) {
            updateNewsHeadline();
        }
    }, 10000);
}

function showCrisisWarning() {
    const warningElement = document.querySelector('.crisis-warning');
    if (!warningElement) return;

    const warnings = [
        "ECONOMIC WARNING: Inequality rising to dangerous levels!",
        "SYSTEMIC RISK ALERT: Financial instability detected!",
        "MARKET ALERT: Wealth concentration threatening stability!"
    ];

    const randomWarning = warnings[Math.floor(Math.random() * warnings.length)];
    warningElement.textContent = randomWarning;
    warningElement.classList.add('show');

    setTimeout(() => {
        warningElement.classList.remove('show');
    }, 3000);
}

function updateStatDisplay() {
    getElement('capital').textContent = formatCapital(capital);
    getElement('workforce').textContent = Math.floor(workforce);
    getElement('layoffs').textContent = layoffs;
    getElement('level').textContent = currentLevel;

    const inequalityBar = document.querySelector('.inequality-meter .meter-bar');
    const inequalityValue = document.getElementById('inequality-value');
    if (inequalityBar) inequalityBar.style.width = `${inequalityLevel}%`;
    if (inequalityValue) inequalityValue.textContent = `${inequalityLevel}%`;

    const crisisBar = document.querySelector('.crisis-meter .meter-bar');
    const crisisValue = document.getElementById('crisis-value');
    if (crisisBar) crisisBar.style.width = `${crisisLevel}%`;
    if (crisisValue) crisisValue.textContent = `${crisisLevel}%`;

    checkEconomicPhaseEffects();
    updateGameSpeed();
}

function checkEconomicPhaseEffects() {
    let newPhase = currentPhase;

    if (crisisLevel > 80) {
        newPhase = PHASE.DEPRESSION;
    } else if (crisisLevel > 60) {
        newPhase = PHASE.RECESSION;
    } else if (crisisLevel > 40 && currentPhase === PHASE.RECESSION) {
        newPhase = PHASE.RECOVERY;
    } else if (crisisLevel < 30) {
        newPhase = PHASE.GROWTH;
    }

    if (newPhase !== currentPhase) {
        currentPhase = newPhase;
        applyPhaseEffects();
    }
}

function applyPhaseEffects() {
    switch (currentPhase) {
        case PHASE.GROWTH:
            economicCycle = 1;
            break;
        case PHASE.RECESSION:
            economicCycle = 0.7;
            layoffs += Math.floor(workforce * 0.1);
            workforce = Math.floor(workforce * 0.9);
            break;
        case PHASE.DEPRESSION:
            economicCycle = 0.4;
            layoffs += Math.floor(workforce * 0.2);
            workforce = Math.floor(workforce * 0.8);
            break;
        case PHASE.RECOVERY:
            economicCycle = 0.8;
            break;
    }
}

// Make sure moveSnakeAwayFromWalls is properly implemented
function moveSnakeAwayFromWalls() {
    if (!corporation || corporation.length === 0) return;

    const head = corporation[0];
    const SAFE_DISTANCE = 2;

    let needsMove = false;
    let moveX = 0;
    let moveY = 0;

    // Check proximity to walls
    if (head.x < SAFE_DISTANCE) {
        moveX = SAFE_DISTANCE - head.x;
        needsMove = true;
    } else if (head.x >= tileCount - SAFE_DISTANCE) {
        moveX = (tileCount - SAFE_DISTANCE - 1) - head.x;
        needsMove = true;
    }

    if (head.y < SAFE_DISTANCE) {
        moveY = SAFE_DISTANCE - head.y;
        needsMove = true;
    } else if (head.y >= tileCount - SAFE_DISTANCE) {
        moveY = (tileCount - SAFE_DISTANCE - 1) - head.y;
        needsMove = true;
    }

    // Move the entire snake if needed
    if (needsMove) {
        for (let i = 0; i < corporation.length; i++) {
            corporation[i].x += moveX;
            corporation[i].y += moveY;

            // Ensure we don't move out of bounds
            corporation[i].x = Math.max(0, Math.min(tileCount - 1, corporation[i].x));
            corporation[i].y = Math.max(0, Math.min(tileCount - 1, corporation[i].y));
        }

        console.log(`Moved snake away from walls by (${moveX}, ${moveY})`);
    }
}

// Implement save game state functionality
function saveGameState() {
    savedGameState = {
        capital,
        workforce,
        layoffs,
        economicCycle,
        assetsConsumed,
        inequalityLevel,
        crisisLevel,
        regulations: [...regulations],
        currentPhase,
        crisisWarnings,
        gameTickCount,
        currentLevel,
        invincibilityMode,
        boostMode,
        boostTickCounter,
        assetsForNextCycle,
        corporation: [...corporation],
        velocityX,
        velocityY,
        lastDirection: {...lastDirection},
        allAssets: [...allAssets],
        allLabor: [...allLabor],
        allCommunities: [...allCommunities],
        sprayTanIntensity,
        gameSpeed
    };
}

// Add function to start game from saved state
function startGameFromSaved() {
    if (!savedGameState) {
        startGame();
        return;
    }

    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));

    restoreGameState();
    savedGameState = null; // Clear after restoring

    document.body.classList.remove('level-7', 'level-8');
    clearCapitalTexts();

    // Update visuals for current level
    if (currentLevel === 7) {
        document.documentElement.style.setProperty('--corp-color', '#e63946');
        document.body.classList.add('level-7');
    } else if (currentLevel === 8) {
        document.documentElement.style.setProperty('--corp-color', '#ff0000');
        document.body.classList.add('level-8');
    }

    // Show/hide UI elements
    const header = document.querySelector('header');
    const statsPanel = document.querySelector('.stats-panel');
    if (header) header.style.display = 'none';
    if (statsPanel) statsPanel.style.display = 'flex';

    // Reset game state for running
    gamePaused = false;
    gameRunning = true;

    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);

    // Hide resume button
    const resumeBtn = document.getElementById('resume-game-btn');
    if (resumeBtn) resumeBtn.style.display = 'none';

    draw(); // Force initial draw
    console.log("Game resumed from saved state");
}

// Implement restore game state functionality
function restoreGameState() {
    if (!savedGameState) return false;

    capital = savedGameState.capital;
    workforce = savedGameState.workforce;
    layoffs = savedGameState.layoffs;
    economicCycle = savedGameState.economicCycle;
    assetsConsumed = savedGameState.assetsConsumed;
    inequalityLevel = savedGameState.inequalityLevel;
    crisisLevel = savedGameState.crisisLevel;
    regulations = [...savedGameState.regulations];
    currentPhase = savedGameState.currentPhase;
    crisisWarnings = savedGameState.crisisWarnings;
    gameTickCount = savedGameState.gameTickCount;
    currentLevel = savedGameState.currentLevel;
    invincibilityMode = savedGameState.invincibilityMode;
    boostMode = savedGameState.boostMode;
    boostTickCounter = savedGameState.boostTickCounter;
    assetsForNextCycle = savedGameState.assetsForNextCycle;
    corporation = [...savedGameState.corporation];
    velocityX = savedGameState.velocityX;
    velocityY = savedGameState.velocityY;
    lastDirection = {...savedGameState.lastDirection};
    allAssets = [...savedGameState.allAssets];
    allLabor = [...savedGameState.allLabor];
    allCommunities = [...savedGameState.allCommunities];
    sprayTanIntensity = savedGameState.sprayTanIntensity;
    gameSpeed = savedGameState.gameSpeed;

    // Update display
    updateStatDisplay();

    // Apply level-specific effects
    if (currentLevel === 7) {
        document.documentElement.style.setProperty('--corp-color', '#e63946');
        document.body.classList.add('level-7');
    } else if (currentLevel === 8) {
        document.documentElement.style.setProperty('--corp-color', '#ff0000');
        document.body.classList.add('level-8');
    }

    return true;
}

// Update createGameStyles to ensure icon colors with FontAwesome preloading
function createGameStyles() {
    if (document.getElementById('game-dynamic-styles')) return;

    const style = document.createElement('style');
    style.id = 'game-dynamic-styles';
    style.textContent = `
        /* Pre-define FontAwesome icon colors */
        .fa-dollar-sign, .wealth-icon { color: var(--wealth, #28a745) !important; }
        .fa-user-tie, .worker-icon { color: var(--worker, #007bff) !important; }
        .fa-users, .people-icon { color: var(--people, #6f42c1) !important; }
        .fa-gavel, .regulation-icon { color: var(--regulation, #dc3545) !important; }
        .fa-twitter, .twitter-icon { color: #1DA1F2 !important; }
        .fa-bolt, .boost-icon { color: #ffc107 !important; }
        
        /* Force FontAwesome loading */
        @font-face {
            font-family: 'FontAwesome';
            src: url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2') format('woff2');
            font-display: block;
        }
        
        .capital-text {
            position: absolute;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            pointer-events: none;
            text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
        }
        .level-message {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            font-size: 1rem;
            z-index: 100;
            max-width: 80%;
            text-align: center;
        }
        .fade-out {
            animation: fadeOut 1s forwards;
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Ensure FontAwesome is properly loaded
    ensureFontAwesomeLoaded();
}

// Add helper function to ensure FontAwesome is properly loaded
function ensureFontAwesomeLoaded() {
    // Create a hidden test element to check if FontAwesome is ready
    const testIcon = document.createElement('i');
    testIcon.className = 'fas fa-check font-test';
    testIcon.style.position = 'absolute';
    testIcon.style.visibility = 'hidden';
    document.body.appendChild(testIcon);

    // If font isn't loaded properly, manually inject it
    if (getComputedStyle(testIcon).fontFamily.indexOf('FontAwesome') === -1) {
        console.log("FontAwesome not detected, adding font link");
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontLink);
    }

    // Remove test element
    setTimeout(() => {
        if (testIcon.parentNode) {
            testIcon.parentNode.removeChild(testIcon);
        }
    }, 1000);
}

// Replace the last initialization line with these two properly separated calls
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('DOMContentLoaded', () => {
    ensureFontAwesomeLoaded();
});