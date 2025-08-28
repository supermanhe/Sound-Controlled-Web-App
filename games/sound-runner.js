class SoundRunner {
    constructor(canvas, audioController) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioController = audioController;
        
        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.gameSpeed = 5;
        
        // Dino properties
        this.dino = {
            x: 50,
            y: 0,
            width: 50,
            height: 60,
            velocityY: 0,
            jumpPower: -15,
            gravity: 0.8,
            isJumping: false,
            isDucking: false,
            runFrame: 0
        };
        
        // Ground
        this.groundHeight = 100;
        
        // Obstacles
        this.obstacles = [];
        this.obstacleTypes = ['cactus', 'bird'];
        this.nextObstacleDistance = 0;
        
        // Background elements
        this.ground = [];
        this.stars = [];
        this.isNight = false;
        
        // Sound detection (降低阈值，更容易触发)
        this.clapThreshold = 35;
        this.lastJumpTime = 0;
        this.jumpCooldown = 400;
        
        // Visual effects
        this.particles = [];
        
        this.setupCanvas();
        this.generateBackground();
    }
    
    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Set dino ground position
        this.dino.y = this.canvas.height - this.groundHeight - this.dino.height;
        this.dino.groundY = this.dino.y;
        
        // Setup audio callback for clap detection
        this.audioController.onVolume((volume) => {
            if (this.isPlaying && !this.isPaused) {
                this.handleSound(volume);
            }
        });
    }
    
    handleSound(volume) {
        const currentTime = Date.now();
        // Detect sudden loud sound (clap)
        if (volume > this.clapThreshold && 
            !this.dino.isJumping &&
            currentTime - this.lastJumpTime > this.jumpCooldown) {
            this.jump();
            this.lastJumpTime = currentTime;
        }
    }
    
    jump() {
        if (!this.dino.isJumping) {
            this.dino.isJumping = true;
            this.dino.velocityY = this.dino.jumpPower;
            this.createJumpEffect();
        }
    }
    
    createJumpEffect() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.dino.x + this.dino.width / 2,
                y: this.dino.y + this.dino.height,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * -2,
                size: Math.random() * 4 + 2,
                life: 1,
                color: '#8B7355'
            });
        }
    }
    
    generateBackground() {
        // Generate ground segments
        for (let i = 0; i < 20; i++) {
            this.ground.push({
                x: i * 50,
                type: Math.random() > 0.8 ? 'bump' : 'flat'
            });
        }
        
        // Generate stars for night mode
        for (let i = 0; i < 30; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * (this.canvas.height - this.groundHeight),
                size: Math.random() * 2 + 1,
                twinkle: Math.random()
            });
        }
    }
    
    start() {
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.obstacles = [];
        this.particles = [];
        this.nextObstacleDistance = 300;
        this.dino.y = this.dino.groundY;
        this.dino.velocityY = 0;
        this.dino.isJumping = false;
        
        // Start audio
        this.audioController.startListening();
        
        this.gameLoop();
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.gameLoop();
        }
    }
    
    stop() {
        this.isPlaying = false;
        this.audioController.stopListening();
    }
    
    update() {
        if (!this.isPlaying || this.isPaused) return;
        
        // Update dino
        if (this.dino.isJumping) {
            this.dino.velocityY += this.dino.gravity;
            this.dino.y += this.dino.velocityY;
            
            // Check if landed
            if (this.dino.y >= this.dino.groundY) {
                this.dino.y = this.dino.groundY;
                this.dino.isJumping = false;
                this.dino.velocityY = 0;
                this.createLandingEffect();
            }
        }
        
        // Update run animation
        if (!this.dino.isJumping) {
            this.dino.runFrame = (this.dino.runFrame + 0.2) % 2;
        }
        
        // Update obstacles
        this.nextObstacleDistance -= this.gameSpeed;
        if (this.nextObstacleDistance <= 0) {
            this.createObstacle();
            this.nextObstacleDistance = 200 + Math.random() * 200;
        }
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= this.gameSpeed;
            
            // Animate birds
            if (obstacle.type === 'bird') {
                obstacle.wingFrame = (obstacle.wingFrame + 0.3) % 2;
            }
            
            // Check collision
            if (this.checkCollision(obstacle)) {
                this.gameOver();
                return;
            }
            
            // Score point
            if (!obstacle.scored && obstacle.x + obstacle.width < this.dino.x) {
                obstacle.scored = true;
                this.score++;
                this.updateScore();
                this.checkLevelUp();
            }
            
            // Remove off-screen obstacles
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
        
        // Update ground
        this.ground.forEach(segment => {
            segment.x -= this.gameSpeed;
            if (segment.x < -50) {
                segment.x = this.canvas.width;
                segment.type = Math.random() > 0.8 ? 'bump' : 'flat';
            }
        });
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3;
            particle.life -= 0.03;
            particle.size *= 0.98;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update stars twinkle
        this.stars.forEach(star => {
            star.twinkle = (star.twinkle + 0.02) % 1;
        });
    }
    
    createObstacle() {
        const type = Math.random() > 0.6 ? 'cactus' : 'bird';
        
        if (type === 'cactus') {
            const size = Math.random() > 0.5 ? 'large' : 'small';
            this.obstacles.push({
                type: 'cactus',
                size: size,
                x: this.canvas.width,
                y: this.canvas.height - this.groundHeight - (size === 'large' ? 60 : 40),
                width: size === 'large' ? 35 : 25,
                height: size === 'large' ? 60 : 40,
                scored: false
            });
        } else {
            const height = Math.random() * 50 + 20;
            this.obstacles.push({
                type: 'bird',
                x: this.canvas.width,
                y: this.canvas.height - this.groundHeight - 80 - height,
                width: 45,
                height: 30,
                wingFrame: 0,
                scored: false
            });
        }
    }
    
    createLandingEffect() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.dino.x + this.dino.width / 2,
                y: this.dino.y + this.dino.height,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * -1,
                size: Math.random() * 3 + 1,
                life: 0.8,
                color: '#8B7355'
            });
        }
    }
    
    checkCollision(obstacle) {
        const dinoBox = {
            x: this.dino.x + 10,
            y: this.dino.y + 5,
            width: this.dino.width - 20,
            height: this.dino.height - 10
        };
        
        return dinoBox.x < obstacle.x + obstacle.width &&
               dinoBox.x + dinoBox.width > obstacle.x &&
               dinoBox.y < obstacle.y + obstacle.height &&
               dinoBox.y + dinoBox.height > obstacle.y;
    }
    
    checkLevelUp() {
        const levelThreshold = this.level * 15;
        if (this.score >= levelThreshold) {
            this.level++;
            this.gameSpeed = 5 + (this.level - 1) * 1;
            this.isNight = this.level % 2 === 0;
            document.getElementById('gameLevel').textContent = `Level ${this.level}`;
            this.showLevelUpEffect();
        }
    }
    
    showLevelUpEffect() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 3,
                vx: Math.random() * 8 - 4,
                vy: Math.random() * 8 - 4,
                size: Math.random() * 6 + 2,
                life: 1,
                color: this.isNight ? '#FFD700' : '#FF6347'
            });
        }
    }
    
    draw() {
        // Sky background
        if (this.isNight) {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#0c1445');
            gradient.addColorStop(1, '#183059');
            this.ctx.fillStyle = gradient;
        } else {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98D8E8');
            this.ctx.fillStyle = gradient;
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars (night mode)
        if (this.isNight) {
            this.stars.forEach(star => {
                this.ctx.save();
                this.ctx.globalAlpha = 0.5 + Math.sin(star.twinkle * Math.PI * 2) * 0.5;
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            });
        }
        
        // Draw sun/moon
        if (this.isNight) {
            this.ctx.fillStyle = '#F0E68C';
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width - 80, 60, 30, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width - 80, 60, 35, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw ground
        this.ctx.fillStyle = '#C4A57B';
        this.ctx.fillRect(0, this.canvas.height - this.groundHeight, 
                         this.canvas.width, this.groundHeight);
        
        // Draw ground texture
        this.ctx.strokeStyle = '#8B7355';
        this.ctx.lineWidth = 2;
        this.ground.forEach(segment => {
            if (segment.type === 'bump') {
                this.ctx.beginPath();
                this.ctx.arc(segment.x, this.canvas.height - this.groundHeight + 5, 
                           15, Math.PI, 0, true);
                this.ctx.stroke();
            }
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.type === 'cactus') {
                this.drawCactus(obstacle);
            } else if (obstacle.type === 'bird') {
                this.drawBird(obstacle);
            }
        });
        
        // Draw dino
        this.drawDino();
        
        // Draw instructions
        if (!this.isPlaying) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Fredoka';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CLAP to Jump! 👏', 
                            this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawDino() {
        const x = this.dino.x;
        const y = this.dino.y;
        
        // Body
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(x + 10, y + 20, 30, 30);
        
        // Head
        this.ctx.fillRect(x + 25, y + 10, 25, 20);
        
        // Tail
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 30);
        this.ctx.lineTo(x + 10, y + 20);
        this.ctx.lineTo(x + 10, y + 40);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(x + 40, y + 18, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(x + 41, y + 18, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Legs
        this.ctx.fillStyle = '#228B22';
        if (this.dino.isJumping) {
            // Both legs extended
            this.ctx.fillRect(x + 15, y + 45, 5, 15);
            this.ctx.fillRect(x + 25, y + 45, 5, 15);
        } else {
            // Running animation
            const frame = Math.floor(this.dino.runFrame);
            if (frame === 0) {
                this.ctx.fillRect(x + 15, y + 45, 5, 15);
                this.ctx.fillRect(x + 25, y + 50, 5, 10);
            } else {
                this.ctx.fillRect(x + 15, y + 50, 5, 10);
                this.ctx.fillRect(x + 25, y + 45, 5, 15);
            }
        }
        
        // Spikes on back
        this.ctx.fillStyle = '#1F5F1F';
        for (let i = 0; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 15 + i * 7, y + 20);
            this.ctx.lineTo(x + 18 + i * 7, y + 10);
            this.ctx.lineTo(x + 21 + i * 7, y + 20);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawCactus(obstacle) {
        this.ctx.fillStyle = '#2ECC40';
        
        if (obstacle.size === 'large') {
            // Main trunk
            this.ctx.fillRect(obstacle.x + 10, obstacle.y, 15, obstacle.height);
            // Arms
            this.ctx.fillRect(obstacle.x, obstacle.y + 10, 8, 20);
            this.ctx.fillRect(obstacle.x + 27, obstacle.y + 15, 8, 15);
        } else {
            // Small cactus
            this.ctx.fillRect(obstacle.x + 5, obstacle.y, 15, obstacle.height);
        }
        
        // Add spikes
        this.ctx.fillStyle = '#27AE60';
        this.ctx.fillRect(obstacle.x + obstacle.width/2 - 1, obstacle.y, 2, 5);
        this.ctx.fillRect(obstacle.x + obstacle.width/2 - 1, obstacle.y + 10, 2, 5);
    }
    
    drawBird(obstacle) {
        const wingOffset = obstacle.wingFrame > 1 ? 5 : -5;
        
        // Body
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2,
                        15, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wings
        this.ctx.fillStyle = '#A0522D';
        this.ctx.beginPath();
        this.ctx.ellipse(obstacle.x + 10, obstacle.y + obstacle.height/2 + wingOffset,
                        12, 6, -20 * Math.PI/180, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(obstacle.x + 35, obstacle.y + obstacle.height/2 + wingOffset,
                        12, 6, 20 * Math.PI/180, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Beak
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + 5, obstacle.y + obstacle.height/2);
        this.ctx.lineTo(obstacle.x - 3, obstacle.y + obstacle.height/2);
        this.ctx.lineTo(obstacle.x + 5, obstacle.y + obstacle.height/2 + 3);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    gameOver() {
        this.stop();
        setTimeout(() => {
            if (confirm(`Game Over! Score: ${this.score}\nPlay again?`)) {
                this.start();
            }
        }, 100);
    }
    
    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}
