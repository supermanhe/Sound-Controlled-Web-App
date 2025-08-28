class VoiceJump {
    constructor(canvas, audioController) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioController = audioController;
        
        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        
        // Player
        this.player = {
            x: 0,
            y: 0,
            width: 30,
            height: 40,
            velocityX: 0,
            velocityY: 0,
            isJumping: false,
            squashAmount: 0,
            rotation: 0
        };
        
        // Platforms
        this.platforms = [];
        this.currentPlatform = null;
        this.targetPlatform = null;
        this.platformColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        
        // Jump mechanics - 新的蓄力系统
        this.jumpPower = 0;
        this.maxJumpPower = 100;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeDirection = 1; // 1 = 增加, -1 = 减少
        this.chargeSpeed = 2; // 蓄力条变化速度
        this.soundThreshold = 25; // 开始蓄力的音量阈值
        this.silenceThreshold = 15; // 停止蓄力的音量阈值
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0
        };
        
        // Visual effects
        this.particles = [];
        this.stars = [];
        this.trails = [];
        
        // Sound control
        this.volumeHistory = [];
        this.historySize = 10;
        
        this.setupCanvas();
        this.generateStars();
    }
    
    setupCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Setup audio callback
        this.audioController.onVolume((volume) => {
            if (this.isPlaying && !this.isPaused) {
                this.handleSound(volume);
            }
        });
    }
    
    handleSound(volume) {
        // Track volume history
        this.volumeHistory.push(volume);
        if (this.volumeHistory.length > this.historySize) {
            this.volumeHistory.shift();
        }
        
        // 开始蓄力：当音量超过阈值且未在跳跃时
        if (volume > this.soundThreshold && !this.isCharging && !this.player.isJumping) {
            this.startCharging();
        }
        
        // 停止蓄力并跳跃：当音量低于阈值时
        if (volume < this.silenceThreshold && this.isCharging) {
            this.releaseJump();
        }
    }
    
    startCharging() {
        this.isCharging = true;
        this.chargeStartTime = Date.now();
        this.jumpPower = 0;
        this.chargeDirection = 1;
    }
    
    releaseJump() {
        if (!this.isCharging || this.player.isJumping) return;
        
        this.isCharging = false;
        
        // Calculate jump vector
        const angle = Math.atan2(
            this.targetPlatform.y - this.currentPlatform.y - 50,
            this.targetPlatform.x - this.currentPlatform.x
        );
        
        const power = this.jumpPower / 100;
        const jumpForce = 5 + power * 15;
        
        this.player.velocityX = Math.cos(angle) * jumpForce;
        this.player.velocityY = Math.sin(angle) * jumpForce - 5;
        this.player.isJumping = true;
        this.player.squashAmount = 0;
        
        // Create jump effect
        this.createJumpEffect();
        
        // Add trail
        this.trails.push({
            points: [{x: this.player.x, y: this.player.y}],
            color: this.currentPlatform.color,
            life: 1
        });
    }
    
    createJumpEffect() {
        const colors = ['#FFD93D', '#FF6B6B', '#4ECDC4'];
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x,
                y: this.player.y + this.player.height,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * -5,
                size: Math.random() * 5 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                type: 'circle'
            });
        }
    }
    
    generateStars() {
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width * 3 - this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                brightness: Math.random()
            });
        }
    }
    
    generatePlatforms() {
        this.platforms = [];
        
        // Starting platform
        const startPlatform = {
            x: this.canvas.width / 4,
            y: this.canvas.height / 2,
            width: 80,
            height: 100,
            color: this.platformColors[0],
            type: 'normal',
            points: 1
        };
        this.platforms.push(startPlatform);
        this.currentPlatform = startPlatform;
        
        // Generate more platforms
        let lastX = startPlatform.x;
        let lastY = startPlatform.y;
        
        for (let i = 1; i < 10; i++) {
            const distance = 100 + Math.random() * 150;
            const angle = -Math.PI/4 + Math.random() * Math.PI/2;
            
            const platform = {
                x: lastX + Math.cos(angle) * distance,
                y: lastY + Math.sin(angle) * distance * 0.5,
                width: 60 + Math.random() * 40,
                height: 80 + Math.random() * 40,
                color: this.platformColors[i % this.platformColors.length],
                type: Math.random() > 0.8 ? 'bonus' : 'normal',
                points: Math.random() > 0.8 ? 3 : 1,
                rotation: Math.random() * 10 - 5
            };
            
            this.platforms.push(platform);
            lastX = platform.x;
            lastY = platform.y;
        }
        
        this.targetPlatform = this.platforms[1];
    }
    
    start() {
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        this.particles = [];
        this.trails = [];
        
        this.generatePlatforms();
        
        // Position player
        this.player.x = this.currentPlatform.x + this.currentPlatform.width / 2 - this.player.width / 2;
        this.player.y = this.currentPlatform.y - this.player.height;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        
        // Setup camera
        this.camera.x = 0;
        this.camera.y = 0;
        
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
        
        // Update charging power (循环蓄力)
        if (this.isCharging) {
            this.jumpPower += this.chargeDirection * this.chargeSpeed;
            
            // 蓄力条到达最大值时开始减少
            if (this.jumpPower >= this.maxJumpPower) {
                this.jumpPower = this.maxJumpPower;
                this.chargeDirection = -1;
            }
            // 蓄力条到达最小值时开始增加
            else if (this.jumpPower <= 0) {
                this.jumpPower = 0;
                this.chargeDirection = 1;
            }
            
            // 更新玩家的压缩动画
            this.player.squashAmount = Math.sin((this.jumpPower / this.maxJumpPower) * Math.PI) * 0.2;
        }
        
        // Update player physics
        if (this.player.isJumping) {
            this.player.velocityY += 0.5; // Gravity
            this.player.x += this.player.velocityX;
            this.player.y += this.player.velocityY;
            
            // Rotation during jump
            this.player.rotation += 5;
            
            // Update trail
            if (this.trails.length > 0) {
                const trail = this.trails[this.trails.length - 1];
                trail.points.push({x: this.player.x, y: this.player.y});
                if (trail.points.length > 20) {
                    trail.points.shift();
                }
            }
            
            // Check platform landing
            for (let platform of this.platforms) {
                if (this.checkLanding(platform)) {
                    this.land(platform);
                    break;
                }
            }
            
            // Check if fallen
            if (this.player.y > this.canvas.height + 200) {
                this.gameOver();
            }
        }
        
        // Update camera smoothly
        this.camera.targetX = this.player.x - this.canvas.width / 2;
        this.camera.targetY = Math.max(0, this.player.y - this.canvas.height / 2);
        this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
        this.camera.y += (this.camera.targetY - this.camera.y) * 0.1;
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3;
            particle.life -= 0.02;
            particle.size *= 0.98;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update trails
        for (let i = this.trails.length - 1; i >= 0; i--) {
            this.trails[i].life -= 0.02;
            if (this.trails[i].life <= 0) {
                this.trails.splice(i, 1);
            }
        }
        
        // Update star parallax
        this.stars.forEach(star => {
            star.brightness = (star.brightness + 0.01) % 1;
        });
        
        // Generate new platforms as needed
        const lastPlatform = this.platforms[this.platforms.length - 1];
        if (lastPlatform.x - this.camera.x < this.canvas.width * 2) {
            this.generateMorePlatforms();
        }
    }
    
    checkLanding(platform) {
        if (this.player.velocityY < 0) return false; // Going up
        
        const playerBottom = this.player.y + this.player.height;
        const playerCenterX = this.player.x + this.player.width / 2;
        
        return playerBottom >= platform.y &&
               playerBottom <= platform.y + 30 &&
               playerCenterX >= platform.x &&
               playerCenterX <= platform.x + platform.width;
    }
    
    land(platform) {
        this.player.isJumping = false;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.rotation = 0;
        
        // Center player on platform
        this.player.x = platform.x + platform.width / 2 - this.player.width / 2;
        this.player.y = platform.y - this.player.height;
        
        // Score points
        if (platform !== this.currentPlatform) {
            const baseScore = platform.points;
            const comboBonus = this.combo;
            const totalScore = baseScore + comboBonus;
            
            this.score += totalScore;
            this.updateScore();
            
            // Update combo
            if (platform === this.targetPlatform) {
                this.combo++;
                this.showPerfectLanding();
            } else {
                this.combo = 0;
            }
            
            // Update platforms
            this.currentPlatform = platform;
            const currentIndex = this.platforms.indexOf(platform);
            if (currentIndex < this.platforms.length - 1) {
                this.targetPlatform = this.platforms[currentIndex + 1];
            }
            
            // Check level up
            this.checkLevelUp();
            
            // Create landing effect
            this.createLandingEffect(platform);
        }
    }
    
    createLandingEffect(platform) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: platform.y,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * -3,
                size: Math.random() * 4 + 2,
                color: platform.color,
                life: 1,
                type: 'square'
            });
        }
    }
    
    showPerfectLanding() {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                size: 6,
                color: '#FFD700',
                life: 1,
                type: 'star'
            });
        }
    }
    
    generateMorePlatforms() {
        const lastPlatform = this.platforms[this.platforms.length - 1];
        
        for (let i = 0; i < 5; i++) {
            const distance = 100 + Math.random() * 150 + this.level * 10;
            const angle = -Math.PI/4 + Math.random() * Math.PI/2;
            
            const platform = {
                x: lastPlatform.x + Math.cos(angle) * distance,
                y: lastPlatform.y + Math.sin(angle) * distance * 0.5,
                width: Math.max(40, 60 - this.level * 2) + Math.random() * 30,
                height: 80 + Math.random() * 40,
                color: this.platformColors[Math.floor(Math.random() * this.platformColors.length)],
                type: Math.random() > 0.7 ? 'bonus' : 'normal',
                points: Math.random() > 0.7 ? 3 : 1,
                rotation: Math.random() * 10 - 5
            };
            
            this.platforms.push(platform);
        }
        
        // Remove old platforms
        if (this.platforms.length > 20) {
            this.platforms.splice(0, 5);
        }
    }
    
    checkLevelUp() {
        const levelThreshold = this.level * 20;
        if (this.score >= levelThreshold) {
            this.level++;
            document.getElementById('gameLevel').textContent = `Level ${this.level}`;
            this.showLevelUpEffect();
        }
    }
    
    showLevelUpEffect() {
        const text = `LEVEL ${this.level}!`;
        this.particles.push({
            x: this.canvas.width / 2,
            y: this.canvas.height / 3,
            vx: 0,
            vy: -1,
            size: 30,
            color: '#FFD700',
            life: 2,
            type: 'text',
            text: text
        });
    }
    
    draw() {
        // Clear canvas
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#2C3E50');
        gradient.addColorStop(1, '#3498DB');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars with parallax
        this.ctx.save();
        this.ctx.translate(-this.camera.x * 0.3, -this.camera.y * 0.3);
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + star.brightness * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
        
        // Apply camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw trails
        this.trails.forEach(trail => {
            this.ctx.strokeStyle = trail.color;
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = trail.life * 0.5;
            this.ctx.beginPath();
            trail.points.forEach((point, i) => {
                if (i === 0) {
                    this.ctx.moveTo(point.x + this.player.width / 2, 
                                   point.y + this.player.height / 2);
                } else {
                    this.ctx.lineTo(point.x + this.player.width / 2, 
                                   point.y + this.player.height / 2);
                }
            });
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        });
        
        // Draw platforms
        this.platforms.forEach(platform => {
            this.ctx.save();
            this.ctx.translate(platform.x + platform.width / 2, 
                             platform.y + platform.height / 2);
            this.ctx.rotate(platform.rotation * Math.PI / 180);
            
            // Platform shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(-platform.width / 2 + 5, -platform.height / 2 + 5, 
                             platform.width, platform.height);
            
            // Platform body
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(-platform.width / 2, -platform.height / 2, 
                             platform.width, platform.height);
            
            // Platform top
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(-platform.width / 2, -platform.height / 2, 
                             platform.width, 10);
            
            // Bonus platform indicator
            if (platform.type === 'bonus') {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('★', 0, 5);
            }
            
            this.ctx.restore();
        });
        
        // Draw target indicator
        if (this.targetPlatform && !this.player.isJumping) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x + this.player.width / 2, 
                          this.player.y + this.player.height / 2);
            this.ctx.lineTo(this.targetPlatform.x + this.targetPlatform.width / 2,
                          this.targetPlatform.y + this.targetPlatform.height / 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            
            if (particle.type === 'circle') {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (particle.type === 'square') {
                this.ctx.fillRect(particle.x - particle.size / 2, 
                                 particle.y - particle.size / 2,
                                 particle.size, particle.size);
            } else if (particle.type === 'star') {
                this.drawStar(particle.x, particle.y, particle.size);
            } else if (particle.type === 'text') {
                this.ctx.font = `bold ${particle.size}px Fredoka`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(particle.text, particle.x, particle.y);
            }
            
            this.ctx.restore();
        });
        
        // Draw player
        this.ctx.save();
        this.ctx.translate(this.player.x + this.player.width / 2, 
                          this.player.y + this.player.height / 2);
        this.ctx.rotate(this.player.rotation * Math.PI / 180);
        this.ctx.scale(1 - this.player.squashAmount, 1 + this.player.squashAmount);
        
        // Player shadow
        if (!this.player.isJumping) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.ellipse(0, this.player.height / 2 + 5, 
                           this.player.width / 2, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Player body
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, 
                         this.player.width, this.player.height);
        
        // Player face
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        this.ctx.arc(5, -5, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Draw charging indicator
        if (this.isCharging) {
            const chargePercent = this.jumpPower / this.maxJumpPower;
            this.ctx.strokeStyle = `hsl(${120 * chargePercent}, 100%, 50%)`;
            this.ctx.lineWidth = 5;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2,
                        this.player.y + this.player.height / 2,
                        30 + chargePercent * 20, 0, Math.PI * 2 * chargePercent);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        
        // Draw combo indicator
        if (this.combo > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Fredoka';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`COMBO x${this.combo}`, this.canvas.width / 2, 60);
        }
        
        // Draw instructions
        if (!this.isPlaying) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Fredoka';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Hold SOUND to Charge Jump! 🎯', 
                            this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px Fredoka';
            this.ctx.fillText('Louder = More Power', 
                            this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }
    
    drawStar(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const innerAngle = angle + Math.PI / 5;
            const outerX = x + Math.cos(angle) * size;
            const outerY = y + Math.sin(angle) * size;
            const innerX = x + Math.cos(innerAngle) * size / 2;
            const innerY = y + Math.sin(innerAngle) * size / 2;
            
            if (i === 0) {
                this.ctx.moveTo(outerX, outerY);
            } else {
                this.ctx.lineTo(outerX, outerY);
            }
            this.ctx.lineTo(innerX, innerY);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    gameOver() {
        this.stop();
        setTimeout(() => {
            if (confirm(`Game Over! Score: ${this.score}\nCombo: ${this.combo}\nPlay again?`)) {
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
