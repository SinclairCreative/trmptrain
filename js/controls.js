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

let touchStartX = 0;
let touchStartY = 0;
let touchContinuousDirection = null;
let touchContinuousInterval = null;
let doubleTapTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    // Wait briefly to make sure game.js has initialized
    setTimeout(() => {
        setupControls();
        setupMobileControls(); // Add mobile controls setup
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

    // Touch/swipe controls for the game canvas
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Touch controls - these are mostly hidden but we'll keep the logic for completeness
    const touchButtons = {
        'up': { dx: 0, dy: -1, check: () => window.velocityY !== 1 },
        'down': { dx: 0, dy: 1, check: () => window.velocityY !== -1 },
        'left': { dx: -1, dy: 0, check: () => window.velocityX !== 1 },
        'right': { dx: 1, dy: 0, check: () => window.velocityX !== -1 }
    };
    
    Object.keys(touchButtons).forEach(direction => {
        const button = document.getElementById(direction);
        if (button) {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleTouchDirection(direction);
                startTouchContinuousMovement(direction);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                stopTouchContinuousMovement();
            });
        }
    });
}

// Add mobile controls setup
function setupMobileControls() {
    const mobileButtons = {
        'mobile-up': 'up',
        'mobile-down': 'down', 
        'mobile-left': 'left',
        'mobile-right': 'right'
    };
    
    Object.keys(mobileButtons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            const direction = mobileButtons[buttonId];
            
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTouchDirection(direction);
                startTouchContinuousMovement(direction);
                
                // Visual feedback
                button.style.transform = 'scale(0.9)';
                button.style.background = 'rgba(255, 215, 0, 1)';
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                stopTouchContinuousMovement();
                
                // Reset visual feedback
                button.style.transform = 'scale(1)';
                button.style.background = 'rgba(212, 175, 55, 0.9)';
            }, { passive: false });
            
            // Prevent context menu on long press
            button.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    });
}

function handleTouchStart(e) {
    e.preventDefault();
    
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // Handle double tap for pause
    const now = Date.now();
    if (now - lastTapTime < 300) {
        if (typeof window.togglePause === 'function' && window.gameRunning) {
            window.togglePause();
        }
        if (doubleTapTimer) {
            clearTimeout(doubleTapTimer);
            doubleTapTimer = null;
        }
    } else {
        doubleTapTimer = setTimeout(() => {
            doubleTapTimer = null;
        }, 300);
    }
    lastTapTime = now;
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(e) {
    e.preventDefault();
    
    if (!window.gameRunning || window.gamePaused) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
    }
    
    let direction;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
    } else {
        direction = deltaY > 0 ? 'down' : 'up';
    }
    
    handleTouchDirection(direction);
    showSwipeIndicator(direction);
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
    stopTouchContinuousMovement();
    touchContinuousDirection = direction;
    
    if (typeof window.setBoostMode === 'function') {
        window.setBoostMode(true);
    }
    
    touchContinuousInterval = setInterval(() => {
        if (touchContinuousDirection && window.gameRunning && !window.gamePaused) {
            handleTouchDirection(touchContinuousDirection);
        }
    }, 100);
}

function stopTouchContinuousMovement() {
    if (touchContinuousInterval) {
        clearInterval(touchContinuousInterval);
        touchContinuousInterval = null;
    }
    
    if (typeof window.setBoostMode === 'function') {
        window.setBoostMode(false);
    }
    
    touchContinuousDirection = null;
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
    const indicators = {
        'up': '↑',
        'down': '↓', 
        'left': '←',
        'right': '→'
    };
    
    const indicator = document.createElement('div');
    indicator.className = 'swipe-indicator';
    indicator.textContent = indicators[direction];
    
    const container = document.getElementById('game-container');
    if (container) {
        container.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 500);
    }
}

// Export functions for use by other modules
window.handleTouchDirection = handleTouchDirection;
window.triggerHapticFeedback = triggerHapticFeedback;
