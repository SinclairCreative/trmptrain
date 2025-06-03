/****************************
 * TR*MP TRAIN - Twitter Storm
 * Special power-up feature
 ****************************/

// Twitter Storm variables
let twitterStorm = null;
let twitterStormActive = false;
let twitterStormEffect = '';
let twitterStormEndTime = 0;

// Twitter effects
const twitterEffects = [
    { name: 'TAX BREAK', description: 'Double assets collected!', duration: 10000 },
    { name: 'FAKE NEWS', description: 'Temporary invincibility!', duration: 8000 },
    { name: 'RALLY TIME', description: 'Slow down game!', duration: 10000 },
    { name: 'LOYAL BASE', description: 'Add length without penalty!', duration: 0 },
    { name: 'EXECUTIVE ORDER', description: 'Clear all regulations!', duration: 0 },
    { name: 'TWITTER FLURRY', description: 'Gain capital for each segment!', duration: 0 },
    { name: 'TV APPEARANCE', description: 'Communities worth more!', duration: 15000 }
];

// Place Twitter Storm power-up randomly - INCREASED FREQUENCY
function placeTweetStorm() {
    if (Math.random() > 0.15 || twitterStorm || twitterStormActive) return; // Increased chance from 0.2 to 0.15

    let attempts = 0;
    twitterStorm = createRandomPosition();

    while (isPositionOccupied(twitterStorm) && attempts < 50) {
        attempts++;
        twitterStorm = createRandomPosition();
    }

    if (attempts >= 50) {
        twitterStorm = null;
        return;
    }

    console.log('Twitter Storm placed at', twitterStorm); // Debug log

    // Auto-remove after 15 seconds (increased from 10)
    setTimeout(() => {
        if (twitterStorm) {
            console.log('Twitter Storm expired');
            twitterStorm = null;
        }
    }, 15000);
}

// Enhanced Twitter Storm activation
function activateTwitterStorm() {
    console.log('Twitter Storm activated!'); // Debug log
    
    const effectIndex = Math.floor(Math.random() * twitterEffects.length);
    const effect = twitterEffects[effectIndex];
    
    twitterStormEffect = effect.name;
    twitterStormActive = true;
    twitterStormEndTime = Date.now() + effect.duration;
    
    createTwitterStormAnimation();
    
    // Show message
    const message = document.createElement('div');
    message.className = 'twitter-message';
    message.innerHTML = `<i class="fab fa-twitter"></i> TWITTER STORM: ${twitterStormEffect}!`;
    message.style.top = '25%';
    document.getElementById('game-container').appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 4000);
    
    // Apply effect based on name
    switch(twitterStormEffect) {
        case 'TAX BREAK':
            // Double asset collection handled in main game
            break;
        case 'FAKE NEWS':
            if (typeof window !== 'undefined') {
                window.invincibilityMode = true;
            }
            break;
        case 'EXECUTIVE ORDER':
            if (typeof window.regulations !== 'undefined') {
                window.regulations.length = 0; // Clear all regulations
            }
            break;
        case 'LOYAL BASE':
            // Add length without penalty
            if (typeof window.corporation !== 'undefined' && window.corporation.length > 0) {
                const lastSegment = window.corporation[window.corporation.length - 1];
                for (let i = 0; i < 3; i++) {
                    window.corporation.push({...lastSegment});
                }
            }
            break;
        case 'TWITTER FLURRY':
            // Gain capital for each segment
            if (typeof window.capital !== 'undefined' && typeof window.corporation !== 'undefined') {
                const bonus = Math.max(10, Math.floor(window.corporation.length * 2));
                window.capital += bonus;
            }
            break;
        case 'TV APPEARANCE':
            // Communities worth more is handled when collecting
            break;
        case 'RALLY TIME':
            // Slow down game speed temporarily
            if (typeof window.gameSpeed !== 'undefined' && typeof window.setGameSpeed === 'function') {
                const originalSpeed = window.gameSpeed;
                window.setGameSpeed(Math.floor(originalSpeed * 1.8)); // Slow down significantly
                
                setTimeout(() => {
                    if (typeof window.setGameSpeed === 'function') {
                        window.updateGameSpeed(); // Reset to normal calculated speed
                    }
                }, effect.duration);
            }
            break;
    }
    
    // Set timeout to end effect
    if (effect.duration > 0) {
        setTimeout(() => {
            endTwitterStorm();
        }, effect.duration);
    } else {
        setTimeout(() => {
            twitterStormActive = false;
            twitterStormEffect = '';
        }, 100);
    }
}

// End Twitter Storm effect
function endTwitterStorm() {
    switch(twitterStormEffect) {
        case 'FAKE NEWS':
            // Don't disable invincibility in level 8
            if (typeof window.currentLevel !== 'undefined' && window.currentLevel < 8) {
                window.invincibilityMode = false;
            }
            break;
        // Other effects will naturally expire
    }
    
    twitterStormActive = false;
    twitterStormEffect = '';
}

// Create Twitter storm animation
function createTwitterStormAnimation() {
    const container = document.getElementById('game-container');
    if (!container || typeof window.corporation === 'undefined' || !window.corporation.length) return;
    
    const x = window.corporation[0].x * window.gridSize + window.gridSize/2;
    const y = window.corporation[0].y * window.gridSize + window.gridSize/2;
    
    // Create blue flash
    const flash = document.createElement('div');
    flash.className = 'twitter-flash';
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    container.appendChild(flash);
    
    setTimeout(() => flash.remove(), 600);
    
    // Create bird icons flying outward
    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const bird = document.createElement('div');
            bird.className = 'twitter-bird';
            bird.innerHTML = '<i class="fab fa-twitter"></i>';
            bird.style.left = `${x}px`;
            bird.style.top = `${y}px`;
            
            const angle = (Math.PI * 2 * i) / 12;
            const distance = 100;
            
            bird.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { 
                    transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(1)`, 
                    opacity: 0 
                }
            ], {
                duration: 1000,
                easing: 'ease-out'
            });
            
            container.appendChild(bird);
            setTimeout(() => bird.remove(), 1000);
        }, i * 50);
    }
}

// Draw Twitter Storm on game canvas with better visibility
function drawTwitterStorm() {
    if (!twitterStorm || typeof window.ctx === 'undefined' || typeof window.gridSize === 'undefined') return;

    // Enhanced pulsating effect
    const time = Date.now();
    const pulseSize = Math.sin(time / 100) * 3;
    const glowIntensity = (Math.sin(time / 200) + 1) * 0.5;

    // Draw glow effect
    window.ctx.shadowColor = '#1DA1F2';
    window.ctx.shadowBlur = 15 + glowIntensity * 10;
    
    window.ctx.fillStyle = '#1DA1F2';
    window.ctx.beginPath();
    window.ctx.arc(
        twitterStorm.x * window.gridSize + window.gridSize/2,
        twitterStorm.y * window.gridSize + window.gridSize/2,
        (window.gridSize/2 - 1) + pulseSize,
        0, 
        Math.PI * 2
    );
    window.ctx.fill();

    // Reset shadow
    window.ctx.shadowBlur = 0;

    // Twitter bird icon with better visibility
    window.ctx.fillStyle = '#FFFFFF';
    window.ctx.font = 'bold 16px serif';
    window.ctx.textAlign = 'center';
    window.ctx.textBaseline = 'middle';
    window.ctx.fillText('🐦', twitterStorm.x * window.gridSize + window.gridSize/2, twitterStorm.y * window.gridSize + window.gridSize/2);
}

// Check Twitter Storm collision
function checkTwitterStormCollision(head) {
    if (!twitterStorm) return false;
    
    if (head.x === twitterStorm.x && head.y === twitterStorm.y) {
        activateTwitterStorm();
        twitterStorm = null;
        return true;
    }
    
    return false;
}

// Periodically try to place Twitter Storm - INCREASED FREQUENCY
function startTwitterStormSystem() {
    // Clear any existing interval first to avoid duplicates
    if (window.twitterStormInterval) {
        clearInterval(window.twitterStormInterval);
    }
    
    window.twitterStormInterval = setInterval(() => {
        if (window.gameRunning && !window.gamePaused) {
            placeTweetStorm();
        }
    }, 5000); // Changed from 7500 to 5000 for more frequent attempts
    
    console.log('Twitter Storm system started');
}

// Expose Twitter storm functions to window
window.drawTwitterStorm = drawTwitterStorm;
window.checkTwitterStormCollision = checkTwitterStormCollision;
window.twitterStorm = twitterStorm;

// Initialize Twitter storm system when document loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(startTwitterStormSystem, 500); // Delay to ensure game has initialized
});