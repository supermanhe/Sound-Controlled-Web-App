// Global variables
let currentGame = null;
let gameCanvas = null;
let isAudioInitialized = false;
let gamePreviewMode = true; // 新增：预览模式标志

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
    
    // 为所有模态框添加背景点击关闭功能
    setupModalBackgroundClose();
});

async function initializeAudio() {
    if (!isAudioInitialized) {
        const success = await audioController.initialize();
        if (success) {
            isAudioInitialized = true;
            console.log('Audio initialized successfully');
        } else {
            showMicPermissionModal();
            return false;
        }
    }
    return true;
}

function setupEventListeners() {
    // Game start button
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    startBtn.addEventListener('click', () => {
        if (currentGame) {
            // 退出预览模式，开始真正的游戏
            gamePreviewMode = false;
            gameCanvas.classList.remove('game-preview');
            gameCanvas.classList.add('game-active');
            
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
        const success = await initializeAudio();
        if (!success) {
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
    
    // 进入预览模式，显示场景但不开始游戏
    gamePreviewMode = true;
    gameCanvas.classList.add('game-preview');
    if (currentGame.showPreview) {
        currentGame.showPreview(); // 显示游戏预览
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

// 自定义弹窗函数
function showGameOverModal(gameTitle, score, combo = null) {
    const modal = document.getElementById('gameOverModal');
    const titleElement = document.getElementById('gameOverTitle');
    const scoreElement = document.getElementById('finalScore');
    const comboElement = document.getElementById('finalCombo');
    const comboStat = document.getElementById('comboStat');
    
    titleElement.textContent = `${gameTitle} - Game Over! 💫`;
    scoreElement.textContent = score;
    
    if (combo !== null && combo > 0) {
        comboElement.textContent = combo;
        comboStat.style.display = 'block';
    } else {
        comboStat.style.display = 'none';
    }
    
    modal.classList.add('show');
}

function closeGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    modal.classList.remove('show');
    
    // 返回到预览模式
    if (currentGame) {
        gamePreviewMode = true;
        gameCanvas.classList.add('game-preview');
        gameCanvas.classList.remove('game-active');
        document.getElementById('startBtn').style.display = 'block';
        document.getElementById('pauseBtn').style.display = 'none';
        if (currentGame.showPreview) {
            currentGame.showPreview();
        }
    }
}

function retryGame() {
    const modal = document.getElementById('gameOverModal');
    modal.classList.remove('show');
    
    if (currentGame) {
        gamePreviewMode = false;
        gameCanvas.classList.remove('game-preview');
        gameCanvas.classList.add('game-active');
        currentGame.start();
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'block';
    }
}

function showMicPermissionModal() {
    const modal = document.getElementById('micPermissionModal');
    modal.classList.add('show');
}

function closeMicPermissionModal() {
    const modal = document.getElementById('micPermissionModal');
    modal.classList.remove('show');
}

async function requestMicPermission() {
    const modal = document.getElementById('micPermissionModal');
    modal.classList.remove('show');
    
    const success = await audioController.initialize();
    if (success) {
        isAudioInitialized = true;
        showNotification('Microphone access granted! 🎤');
    } else {
        showNotification('Microphone access denied. Please enable it in your browser settings.');
    }
}

// 模态框背景点击关闭功能
function setupModalBackgroundClose() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

// Tab切换功能
function switchTab(tabName) {
    // 更新tab按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // 显示对应页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    if (tabName === 'game') {
        document.getElementById('homePage').classList.add('active');
    } else if (tabName === 'rank') {
        document.getElementById('rankPage').classList.add('active');
    }
}

// 排行榜Tab切换功能
function switchRankTab(rankType) {
    // 更新rank tab按钮状态
    document.querySelectorAll('.rank-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchRankTab('${rankType}')"]`).classList.add('active');
    
    // 显示对应排行榜
    document.querySelectorAll('.rank-list').forEach(list => {
        list.classList.remove('active');
    });
    
    const rankListMap = {
        'overall': 'overallRank',
        'flappy': 'flappyRank', 
        'runner': 'runnerRank',
        'jump': 'jumpRank'
    };
    
    const targetList = document.getElementById(rankListMap[rankType]);
    if (targetList) {
        targetList.classList.add('active');
    }
}

console.log('Sound Quest initialized! 🎮🎤');
