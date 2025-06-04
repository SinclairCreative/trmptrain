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
let autoPauseEnabled = true; // Always ON by default
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

// Level 8 timer variables
let level8Timer = null;
let level8StartTime = null;
let level8Duration = 30000; // 30 seconds

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
        
        // Clear Level 8 timer if active
        if (level8Timer) {
            clearInterval(level8Timer);
            level8Timer = null;
        }
        
        const timerIndicator = document.getElementById('level8-timer-indicator');
        if (timerIndicator) {
            timerIndicator.classList.remove('show');
        }

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
    
    // Clear Level 8 timer if active
    if (level8Timer) {
        clearInterval(level8Timer);
        level8Timer = null;
    }
    
    const timerIndicator = document.getElementById('level8-timer-indicator');
    if (timerIndicator) {
        timerIndicator.classList.remove('show');
    }

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
            let baseValue = 5 * economicCycle + workerBonus;
            
            // Apply Twitter Storm effect for double assets
            if (twitterStormActive && twitterStormEffect === 'TAX BREAK') {
                baseValue *= 2;
            }
            
            capital += baseValue;
            assetsConsumed++;
            
            // Adjust inequality progression based on level
            let inequalityIncrease = 2;
            if (currentLevel >= 7) { // Presidency levels
                inequalityIncrease = -15; // Drain inequality during presidency
            } else if (currentLevel >= 5) { // Near presidency
                inequalityIncrease = 8; // Faster rise
            }
            inequalityLevel = Math.max(-100, Math.min(inequalityLevel + inequalityIncrease, 100));

            createEnhancedConsumptionEffect(
                allAssets[i].x * gridSize + gridSize/2, 
                allAssets[i].y * gridSize + gridSize/2, 
                getComputedStyle(document.documentElement).getPropertyValue('--wealth').trim(),
                Math.floor(baseValue)
            );

            allAssets.splice(i, 1);
            placeAsset();

            // Increase chance for labor and community spawning
            if (allLabor.length < currentLevel && Math.random() > 0.5) {
                setTimeout(() => placeLabor(), 1500);
            }

            if (allCommunities.length < currentLevel && Math.random() > 0.7) {
                setTimeout(() => placeCommunity(), 2000);
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
        
        // Start Level 8 timer
        startLevel8Timer();
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

    // Draw all assets with proper colors
    allAssets.forEach(asset => {
        ctx.fillStyle = wealthColor;
        ctx.beginPath();
        ctx.arc(
            asset.x * gridSize + gridSize/2,
            asset.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0, 
            Math.PI * 2
        );
        ctx.fill();

        // Ensure icon is colored
        ctx.fillStyle = wealthColor;
        ctx.font = 'bold 14px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💰', asset.x * gridSize + gridSize/2, asset.y * gridSize + gridSize/2);
    });

    // Draw all labor with proper colors
    allLabor.forEach(laborPos => {
        ctx.fillStyle = workerColor;
        ctx.beginPath();
        ctx.arc(
            laborPos.x * gridSize + gridSize/2,
            laborPos.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0, 
            Math.PI * 2
        );
        ctx.fill();

        // Ensure icon is colored
        ctx.fillStyle = workerColor;
        ctx.font = 'bold 14px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👷', laborPos.x * gridSize + gridSize/2, laborPos.y * gridSize + gridSize/2);
    });

    // Draw all communities with proper colors
    allCommunities.forEach(communityPos => {
        ctx.fillStyle = peopleColor;
        ctx.beginPath();
        ctx.arc(
            communityPos.x * gridSize + gridSize/2,
            communityPos.y * gridSize + gridSize/2,
            gridSize/2 - 2,
            0, 
            Math.PI * 2
        );
        ctx.fill();

        // Ensure icon is colored
        ctx.fillStyle = peopleColor;
        ctx.font = 'bold 14px FontAwesome';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👥', communityPos.x * gridSize + gridSize/2, communityPos.y * gridSize + gridSize/2);
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
    // Calculate crisis speed multiplier - 1% increase per 10% crisis
    let crisisMultiplier = 1;
    if (crisisLevel >= 100) {
        crisisMultiplier = 0.5; // Double speed (half interval)
    } else {
        crisisMultiplier = 1 - (crisisLevel / 1000); // 1% per 10% crisis
    }
    
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
}

// Level 8 timer functions
function startLevel8Timer() {
    if (currentLevel !== 8) return;
    
    level8StartTime = Date.now();
    
    // Create timer indicator element
    let timerIndicator = document.getElementById('level8-timer-indicator');
    if (!timerIndicator) {
        timerIndicator = document.createElement('div');
        timerIndicator.id = 'level8-timer-indicator';
        timerIndicator.className = 'level8-timer-indicator';
        document.getElementById('game-container').appendChild(timerIndicator);
    }
    
    // Start the timer countdown
    level8Timer = setInterval(() => {
        const elapsed = Date.now() - level8StartTime;
        const remaining = Math.max(0, level8Duration - elapsed);
        const secondsLeft = Math.ceil(remaining / 1000);
        
        timerIndicator.textContent = `MELTDOWN: ${secondsLeft}s`;
        timerIndicator.classList.add('show');
        
        if (remaining <= 0) {
            endLevel8Timer();
        }
    }, 100);
}

function endLevel8Timer() {
    if (level8Timer) {
        clearInterval(level8Timer);
        level8Timer = null;
    }
    
    const timerIndicator = document.getElementById('level8-timer-indicator');
    if (timerIndicator) {
        timerIndicator.classList.remove('show');
    }
    
    // End the game or show level 8 ending screen
    if (currentLevel === 8 && gameRunning) {
        showLevel8Ending();
    }
}

function showLevel8Ending() {
    gameRunning = false;
    clearInterval(gameInterval);
    
    // Hide timer indicator
    const timerIndicator = document.getElementById('level8-timer-indicator');
    if (timerIndicator) {
        timerIndicator.classList.remove('show');
    }
    
    // Create or show Level 8 ending screen
    let endingScreen = document.getElementById('level8-ending-screen');
    if (!endingScreen) {
        endingScreen = document.createElement('div');
        endingScreen.id = 'level8-ending-screen';
        endingScreen.className = 'screen';
        endingScreen.innerHTML = `
            <div class="level8-ending-content">
                <h1 class="level8-title">MAXIMUM CHAOS ACHIEVED!</h1>
                <div class="level8-subtitle">You've survived the ultimate meltdown</div>
                <div class="level8-stats">
                    <div class="stat-item">
                        <div class="stat-value">${formatCapital(capital)}</div>
                        <div class="stat-label">Final Capital</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${assetsConsumed}</div>
                        <div class="stat-label">Assets Consumed</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${layoffs}</div>
                        <div class="stat-label">Total Layoffs</div>
                    </div>
                </div>
                <div class="level8-buttons">
                    <button id="level8-new-game-btn">NEW GAME</button>
                    <button id="level8-menu-btn">MAIN MENU</button>
                </div>
            </div>
        `;
        document.getElementById('game-container').appendChild(endingScreen);
        
        // Add event listeners
        document.getElementById('level8-new-game-btn').addEventListener('click', startGame);
        document.getElementById('level8-menu-btn').addEventListener('click', () => {
            endingScreen.classList.remove('active');
            getElement('start-screen').classList.add('active');
            document.querySelector('header').style.display = 'block';
            document.querySelector('.stats-panel').style.display = 'none';
        });
    }
    
    endingScreen.classList.add('active');
    
    // Update high score if needed
    if (capital > highScore) {
        highScore = capital;
        localStorage.setItem('capitalHighScore', highScore);
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
        gameSpeed,
        level8StartTime,
        level8TimerActive: level8Timer !== null
    };
}

// Replace the last initialization line with these two properly separated calls
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('DOMContentLoaded', () => {
    ensureFontAwesomeLoaded();
});

// Restore game state from savedGameState
function startGameFromSaved() {
    if (!savedGameState) return;

    // Restore basic game state
    capital = savedGameState.capital;
    workforce = savedGameState.workforce;
    layoffs = savedGameState.layoffs;
    economicCycle = savedGameState.economicCycle;
    assetsConsumed = savedGameState.assetsConsumed;
    inequalityLevel = savedGameState.inequalityLevel;
    crisisLevel = savedGameState.crisisLevel;
    regulations = savedGameState.regulations;
    currentPhase = savedGameState.currentPhase;
    crisisWarnings = savedGameState.crisisWarnings;
    gameTickCount = savedGameState.gameTickCount;
    currentLevel = savedGameState.currentLevel;
    invincibilityMode = savedGameState.invincibilityMode;
    boostMode = savedGameState.boostMode;
    boostTickCounter = savedGameState.boostTickCounter;
    assetsForNextCycle = savedGameState.assetsForNextCycle;

    // Restore snake position and velocity
    corporation = savedGameState.corporation;
    velocityX = savedGameState.velocityX;
    velocityY = savedGameState.velocityY;
    lastDirection = savedGameState.lastDirection;

    // Restore resources
    allAssets = savedGameState.allAssets;
    allLabor = savedGameState.allLabor;
    allCommunities = savedGameState.allCommunities;

    sprayTanIntensity = savedGameState.sprayTanIntensity;
    gameSpeed = savedGameState.gameSpeed;
    
    // Restore Level 8 timer if it was active
    if (savedGameState.level8TimerActive && currentLevel === 8) {
        level8StartTime = savedGameState.level8StartTime;
        startLevel8Timer();
    }
    
    // Update display
    updateStatDisplay();
}

// Toggle fullscreen mode
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

// Resize canvas to fit container while maintaining aspect ratio
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

// Check if a position is occupied by any game element
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

// Update the statistics display on the UI
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
}

// Check and update economic phase based on crisis level
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

// Apply effects based on current economic phase
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

// Create dynamic styles for the game including FontAwesome icons
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