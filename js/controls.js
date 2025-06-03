/**
 * Tr*mp Train Game Controls
 * Handles all user input for the game
 */

// Global variables for controls
window.lastDirectionChange = Date.now();
window.DIRECTION_CHANGE_DELAY = 0; // REMOVED DELAY - was 80ms
window.lastSwipeTime = 0;

// Control state variables
let keysPressed = new Set();
let continuousMovementInterval = null;
let touchHoldTimeout = null;
let currentTouchDirection = null;
let lastTapTime = 0;
const SWIPE_COOLDOWN = 50; // Reduced from 150ms for more responsive swipes

document.addEventListener('DOMContentLoaded', () => {
    // Wait briefly to make sure game.js has initialized
    setTimeout(() => {
        setupControls();
        setupEnhancedTouchControls();
    }, 100);
});

function setupControls() {
    // Keyboard controls with continuous movement
    document.addEventListener('keydown', (e) => {
        // Prevent default behavior for all navigation keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' ', 'Spacebar'].includes(e.key)) {
            e.preventDefault();
        }
        
        if (e.key === 'Enter' && !window.gameRunning) {
            if (typeof window.startGame === 'function') {
                window.startGame();
            }
            return;
        }
        
        // Direction controls
        if (!window.gameRunning) return;
        
        // Add key to pressed set
        keysPressed.add(e.key);
        
        // Handle initial direction change
        handleDirectionChange(e.key);
        
        // Start continuous movement if not already started
        if (!continuousMovementInterval && isDirectionKey(e.key)) {
            startContinuousMovement();
        }
        
        // Handle pause
        if (e.key === ' ' || e.key === 'Spacebar') {
            if (typeof window.togglePause === 'function') {
                window.togglePause();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        // Remove key from pressed set
        keysPressed.delete(e.key);
        
        // Stop continuous movement if no direction keys are pressed
        if (!hasDirectionKeyPressed()) {
            stopContinuousMovement();
        }
    });

    // Touch controls - these are mostly hidden but we'll keep the logic for completeness
    const touchButtons = {
        'up': { dx: 0, dy: -1, check: () => window.velocityY !== 1 },
        'down': { dx: 0, dy: 1, check: () => window.velocityY !== -1 },
        'left': { dx: -1, dy: 0, check: () => window.velocityX !== 1 },
        'right': { dx: 1, dy: 0, check: () => window.velocityX !== -1 }
    };
    
    Object.keys(touchButtons).forEach(direction => {
        const btn = document.getElementById(direction);
        if (btn) {
            btn.addEventListener('click', () => {
                if (Date.now() - window.lastDirectionChange < window.DIRECTION_CHANGE_DELAY) {
                    return; // Ignore rapid taps
                }
                const dir = touchButtons[direction];
                if (dir.check() && window.gameRunning) {
                    window.velocityX = dir.dx;
                    window.velocityY = dir.dy;
                    window.lastDirectionChange = Date.now();
                }
            });
        }
    });
}

function setupEnhancedTouchControls() {
    const gameCanvas = document.getElementById('game-canvas');
    if (!gameCanvas) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    // Prevent scrolling when touching the canvas
    gameCanvas.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = Date.now();
        
        // Count touches for pause functionality
        if (window.gameRunning && e.touches.length === 2) {
            if (typeof window.togglePause === 'function') {
                window.togglePause();
            }
            e.preventDefault();
        }
    }, { passive: false });

    gameCanvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Enhanced swipe detection with double-tap
    gameCanvas.addEventListener('touchend', function(e) {
        const currentTime = Date.now();
        
        // Check for double tap
        if (currentTime - lastTapTime < 300) {
            // Double tap detected
            if (typeof window.togglePause === 'function') {
                window.togglePause();
            }
            lastTapTime = 0; // Reset to prevent triple-tap issues
            return;
        }
        lastTapTime = currentTime;
        
        // Ignore if too close to last swipe
        if (Date.now() - window.lastSwipeTime < SWIPE_COOLDOWN) return;
        
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        
        // Calculate distance and time
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        const elapsedTime = Date.now() - touchStartTime;
        
        // Calculate speed
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);
        const speed = distance / elapsedTime;
        
        // Minimum distance threshold based on speed
        const MIN_DISTANCE = speed > 1 ? 5 : 10;
        
        // Only detect significant swipes
        if (distance < MIN_DISTANCE) return;
        
        // Determine swipe direction based on which difference is greater
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0) {
                // Swipe left
                if (window.velocityX !== 1 && window.gameRunning) {
                    window.velocityX = -1;
                    window.velocityY = 0;
                    showSwipeIndicator('left');
                }
            } else {
                // Swipe right
                if (window.velocityX !== -1 && window.gameRunning) {
                    window.velocityX = 1;
                    window.velocityY = 0;
                    showSwipeIndicator('right');
                }
            }
        } else {
            // Vertical swipe
            if (diffY > 0) {
                // Swipe up
                if (window.velocityY !== 1 && window.gameRunning) {
                    window.velocityX = 0;
                    window.velocityY = -1;
                    showSwipeIndicator('up');
                }
            } else {
                // Swipe down
                if (window.velocityY !== -1 && window.gameRunning) {
                    window.velocityX = 0;
                    window.velocityY = 1;
                    showSwipeIndicator('down');
                }
            }
        }
        
        window.lastSwipeTime = Date.now();
    });
    
    // Add enhanced touch visual feedback for control buttons
    const buttons = ['up', 'down', 'left', 'right'];
    buttons.forEach(direction => {
        const btn = document.getElementById(direction);
        if (!btn) return;
        
        // Touch start - hold detection
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            btn.classList.add('active');
            currentTouchDirection = direction;
            handleTouchDirection(direction);
            
            // Start continuous movement after 200ms
            touchHoldTimeout = setTimeout(() => {
                startTouchContinuousMovement(direction);
            }, 200);
        });
        
        // Touch end/cancel - release
        ['touchend', 'touchcancel'].forEach(event => {
            btn.addEventListener(event, (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                stopTouchContinuousMovement();
            });
        });
    });
}

// Helper functions
function isDirectionKey(key) {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
}

function hasDirectionKeyPressed() {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].some(key => keysPressed.has(key));
}

function handleDirectionChange(key) {
    // REMOVED DELAY CHECK to allow instant direction changes
    
    // Store previous direction
    const prevX = window.velocityX;
    const prevY = window.velocityY;
    
    let directionChanged = false;
    
    switch (key) {
        case 'ArrowUp':
            if (prevY !== 1) { // Not moving down
                window.velocityX = 0;
                window.velocityY = -1;
                directionChanged = true;
            }
            break;
        case 'ArrowDown':
            if (prevY !== -1) { // Not moving up
                window.velocityX = 0;
                window.velocityY = 1;
                directionChanged = true;
            }
            break;
        case 'ArrowLeft':
            if (prevX !== 1) { // Not moving right
                window.velocityX = -1;
                window.velocityY = 0;
                directionChanged = true;
            }
            break;
        case 'ArrowRight':
            if (prevX !== -1) { // Not moving left
                window.velocityX = 1;
                window.velocityY = 0;
                directionChanged = true;
            }
            break;
    }
    
    if (directionChanged) {
        window.lastDirectionChange = Date.now();
        window.lastDirection = { x: prevX, y: prevY };
    }
}

function handleTouchDirection(direction) {
    // REMOVED DELAY CHECK to allow instant direction changes on touch
    
    const directionMap = {
        'up': { x: 0, y: -1, prevent: () => window.velocityY !== 1 },
        'down': { x: 0, y: 1, prevent: () => window.velocityY !== -1 },
        'left': { x: -1, y: 0, prevent: () => window.velocityX !== 1 },
        'right': { x: 1, y: 0, prevent: () => window.velocityX !== -1 }
    };
    
    const dir = directionMap[direction];
    if (dir && dir.prevent() && window.gameRunning) {
        window.velocityX = dir.x;
        window.velocityY = dir.y;
        window.lastDirectionChange = Date.now();
    }
}

// Boost mode functions
function startContinuousMovement() {
    if (typeof window.setBoostMode === 'function') {
        window.setBoostMode(true);
    }
    
    continuousMovementInterval = setInterval(() => {
        if (!window.gameRunning || !hasDirectionKeyPressed()) {
            stopContinuousMovement();
        }
    }, 50);
}

function stopContinuousMovement() {
    if (typeof window.setBoostMode === 'function') {
        window.setBoostMode(false);
    }
    
    if (continuousMovementInterval) {
        clearInterval(continuousMovementInterval);
        continuousMovementInterval = null;
    }
}

function startTouchContinuousMovement(direction) {
    if (typeof window.setBoostMode === 'function') {
        window.setBoostMode(true);
    }
    
    continuousMovementInterval = setInterval(() => {
        if (!window.gameRunning || currentTouchDirection !== direction) {
            stopTouchContinuousMovement();
        }
    }, 50);
}

function stopTouchContinuousMovement() {
    currentTouchDirection = null;
    
    if (typeof window.setBoostMode === 'function') {
        window.setBoostMode(false);
    }
    
    if (touchHoldTimeout) {
        clearTimeout(touchHoldTimeout);
        touchHoldTimeout = null;
    }
    
    if (continuousMovementInterval) {
        clearInterval(continuousMovementInterval);
        continuousMovementInterval = null;
    }
}

// Visual feedback functions - keep these but they won't be called
function showBoostIndicator() {
    // Function kept for compatibility but won't be called
}

function hideBoostIndicator() {
    // Function kept for compatibility but won't be called
}

// Haptic feedback for mobile
function triggerHapticFeedback() {
    if (window.hapticEnabled && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Visual swipe indicators
function showSwipeIndicator(direction) {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    const indicator = document.createElement('div');
    indicator.className = `swipe-indicator swipe-${direction}`;
    indicator.innerHTML = getDirectionArrow(direction);
    
    container.appendChild(indicator);
    triggerHapticFeedback();
    
    setTimeout(() => indicator.remove(), 500);
}

function getDirectionArrow(direction) {
    const arrows = {
        'up': '↑',
        'down': '↓', 
        'left': '←',
        'right': '→'
    };
    return arrows[direction] || '';
}
