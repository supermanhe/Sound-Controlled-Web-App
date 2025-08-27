// Global variables
let currentGame = null;
let gameCanvas = null;
let isAudioInitialized = false;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    gameCanvas = document.getElementById('gameCanvas');
    
    // Initialize audio controller on first user interaction
    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
    
    // Setup button listeners
    setupEventListeners();
    
    // Add animation to sound waves
    animateSoundWaves();
    
    // Check for mobile device
    checkMobileDevice();
});

async function initializeAudio() {
    if (!isAudioInitialized) {
        const success = await audioController.initialize();
        if (success) {
            isAudioInitialized = true;
            console.log('Audio initialized successfully');
        }
    }
}

function setupEventListeners() {
    // Game start button
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    startBtn.addEventListener('click', () => {
        if (currentGame) {
            currentGame.start();
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'block';
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        if (currentGame) {
            currentGame.pause();
            pauseBtn.textContent = currentGame.isPaused ? 'Resume' : 'Pause';
        }
    });
}

// Start a specific game
async function startGame(gameType) {
    // Initialize audio if needed
    if (!isAudioInitialized) {
        await initializeAudio();
        if (!isAudioInitialized) {
            alert('Please allow microphone access to play!');
            return;
        }
    }
    
    // Clean up previous game
    if (currentGame) {
        currentGame.stop();
        currentGame = null;
    }
    
    // Switch to game view
    document.getElementById('homePage').classList.remove('active');
    document.getElementById('gameContainer').classList.add('active');
    
    // Reset UI
    document.getElementById('score').textContent = '0';
    document.getElementById('gameLevel').textContent = 'Level 1';
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('pauseBtn').style.display = 'none';
    
    // Create game instance
    switch(gameType) {
        case 'flappy':
            currentGame = new FlappyVoice(gameCanvas, audioController);
            document.getElementById('gameTitle').textContent = 'Flappy Voice';
            gameCanvas.style.background = '#87CEEB';
            break;
            
        case 'dino':
            currentGame = new SoundRunner(gameCanvas, audioController);
            document.getElementById('gameTitle').textContent = 'Sound Runner';
            gameCanvas.style.background = 'linear-gradient(to bottom, #87CEEB, #98D8E8)';
            break;
            
        case 'jump':
            currentGame = new VoiceJump(gameCanvas, audioController);
            document.getElementById('gameTitle').textContent = 'Voice Jump';
            gameCanvas.style.background = 'linear-gradient(to bottom, #2C3E50, #3498DB)';
            break;
    }
}

// Return to home page
function backToHome() {
    if (currentGame) {
        currentGame.stop();
        currentGame = null;
    }
    
    document.getElementById('gameContainer').classList.remove('active');
    document.getElementById('homePage').classList.add('active');
}

// Show tutorial modal
function showTutorial() {
    const modal = document.getElementById('tutorialModal');
    modal.classList.add('show');
}

// Close tutorial modal
function closeTutorial() {
    const modal = document.getElementById('tutorialModal');
    modal.classList.remove('show');
}

// Share app functionality
function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'Sound Quest - Voice Controlled Games',
            text: 'Check out these awesome voice-controlled games! Control games with your voice! 🎤🎮',
            url: window.location.href
        }).then(() => {
            console.log('Shared successfully');
        }).catch((error) => {
            console.log('Error sharing:', error);
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareText = `Check out Sound Quest - Voice Controlled Games! ${window.location.href}`;
        
        // Try to copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showNotification('Link copied to clipboard! 📋');
            }).catch(() => {
                showShareFallback(shareText);
            });
        } else {
            showShareFallback(shareText);
        }
    }
}

// Show share fallback dialog
function showShareFallback(text) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Share Sound Quest</h2>
            <p>Copy this link to share:</p>
            <input type="text" value="${text}" style="width: 100%; padding: 10px; margin: 10px 0; border: 2px solid #667eea; border-radius: 10px; font-family: 'Fredoka', sans-serif;" readonly>
            <button class="btn play-btn" onclick="
                this.previousElementSibling.select();
                document.execCommand('copy');
                showNotification('Copied to clipboard! 📋');
                this.parentElement.parentElement.remove();
            ">Copy Link</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 30px;
        border-radius: 25px;
        font-family: 'Fredoka', sans-serif;
        font-size: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animate sound waves on game cards
function animateSoundWaves() {
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const waves = card.querySelectorAll('.sound-wave span');
            waves.forEach((wave, index) => {
                wave.style.animationDelay = `${index * 0.1}s`;
                wave.style.animationDuration = '0.8s';
            });
        });
        
        card.addEventListener('mouseleave', () => {
            const waves = card.querySelectorAll('.sound-wave span');
            waves.forEach((wave, index) => {
                wave.style.animationDelay = `${index * 0.1}s`;
                wave.style.animationDuration = '1.2s';
            });
        });
    });
}

// Check if mobile device and adjust UI
function checkMobileDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.classList.add('mobile-device');
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Prevent pull-to-refresh
        document.body.addEventListener('touchmove', (e) => {
            if (e.target.closest('#gameCanvas')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// Add keyboard shortcuts for testing
document.addEventListener('keydown', (e) => {
    if (currentGame && currentGame.isPlaying) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                // Simulate sound input for testing
                if (currentGame instanceof FlappyVoice) {
                    currentGame.jump();
                } else if (currentGame instanceof SoundRunner) {
                    currentGame.jump();
                } else if (currentGame instanceof VoiceJump) {
                    if (!currentGame.isCharging) {
                        currentGame.startCharging();
                    }
                }
                break;
            case 'Escape':
                backToHome();
                break;
            case 'p':
            case 'P':
                if (currentGame) {
                    currentGame.pause();
                }
                break;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (currentGame && currentGame.isPlaying) {
        if (e.key === ' ' && currentGame instanceof VoiceJump) {
            if (currentGame.isCharging) {
                currentGame.releaseJump();
            }
        }
    }
});

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

console.log('Sound Quest initialized! 🎮🎤');
