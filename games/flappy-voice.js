class FlappyVoice {
    constructor(canvas, audioController) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioController = audioController;
        
        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.level = 1;
        this.gameSpeed = 2;
        
        // Bird properties
        this.bird = {
            x: 80,
            y: 250,
            width: 40,
            height: 35,
            velocity: 0,
            gravity: 0.5,
            jumpPower: -8,
            rotation: 0
        };
        
        // Pipes array
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpeed = this.gameSpeed;
        this.nextPipeDistance = 0;
        
        // Visual effects
        this.clouds = [];
        this.particles = [];
        
        // Sound threshold
        this.volumeThreshold = 25;
        this.lastJumpTime = 0;
        this.jumpCooldown = 300; // ms
        
        this.setupCanvas();
        this.generateClouds();
    }
    
    setupCanvas() {
        // Set canvas size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Setup audio callbacks
        this.audioController.onVolume((volume) => {
            if (this.isPlaying && !this.isPaused) {
                this.handleSound(volume);
            }
        });
    }
    
    handleSound(volume) {
        const currentTime = Date.now();
        if (volume > this.volumeThreshold && 
            currentTime - this.lastJumpTime > this.jumpCooldown) {
            this.jump();
            this.lastJumpTime = currentTime;
        }
    }
    
    jump() {
        this.bird.velocity = this.bird.jumpPower;
        this.bird.rotation = -20;
        this.createJumpParticles();
    }
    
    createJumpParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y + this.bird.height / 2,
                vx: Math.random() * 2 - 1,
                vy: Math.random() * 2,
                life: 1,
                color: `hsl(${Math.random() * 60 + 30}, 100%, 60%)`
            });
        }
    }
    
    generateClouds() {
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 150,
                width: Math.random() * 60 + 40,
                height: Math.random() * 20 + 20,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    start() {
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.pipes = [];
        this.particles = [];
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.nextPipeDistance = 200;
        
        // Start audio listening
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
        
        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        
        // Update rotation
        if (this.bird.velocity > 0) {
            this.bird.rotation = Math.min(90, this.bird.rotation + 3);
        }
        
        // Check boundaries
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }
        
        if (this.bird.y + this.bird.height > this.canvas.height) {
            this.gameOver();
        }
        
        // Update pipes
        this.nextPipeDistance -= this.pipeSpeed;
        if (this.nextPipeDistance <= 0) {
            this.createPipe();
            this.nextPipeDistance = 250 + Math.random() * 100;
        }
        
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            
            // Check collision
            if (this.checkCollision(pipe)) {
                this.gameOver();
            }
            
            // Score point
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.updateScore();
                this.checkLevelUp();
            }
            
            // Remove off-screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width;
            }
        });
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1;
            particle.life -= 0.02;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    createPipe() {
        const minHeight = 50;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            scored: false
        });
    }
    
    checkCollision(pipe) {
        // Check top pipe collision
        if (this.bird.x + this.bird.width > pipe.x &&
            this.bird.x < pipe.x + this.pipeWidth &&
            this.bird.y < pipe.topHeight) {
            return true;
        }
        
        // Check bottom pipe collision
        if (this.bird.x + this.bird.width > pipe.x &&
            this.bird.x < pipe.x + this.pipeWidth &&
            this.bird.y + this.bird.height > pipe.bottomY) {
            return true;
        }
        
        return false;
    }
    
    checkLevelUp() {
        const levelThreshold = this.level * 10;
        if (this.score >= levelThreshold) {
            this.level++;
            this.pipeSpeed = this.gameSpeed + (this.level - 1) * 0.5;
            this.pipeGap = Math.max(120, 150 - (this.level - 1) * 5);
            document.getElementById('gameLevel').textContent = `Level ${this.level}`;
            this.showLevelUpEffect();
        }
    }
    
    showLevelUpEffect() {
        // Create celebration particles
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * 6 - 3,
                life: 1,
                color: `hsl(${Math.random() * 360}, 100%, 60%)`
            });
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.drawCloud(cloud.x, cloud.y, cloud.width, cloud.height);
        });
        
        // Draw pipes
        this.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.fillStyle = '#2ECC40';
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.fillStyle = '#27AE60';
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, this.pipeWidth + 10, 30);
            
            // Bottom pipe
            this.ctx.fillStyle = '#2ECC40';
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, 
                            this.canvas.height - pipe.bottomY);
            this.ctx.fillStyle = '#27AE60';
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 30);
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Draw bird
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, 
                          this.bird.y + this.bird.height / 2);
        this.ctx.rotate((this.bird.rotation * Math.PI) / 180);
        
        // Bird body
        this.ctx.fillStyle = '#FFD93D';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 
                        0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.width / 4, -this.bird.height / 4, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.width / 4 + 2, -this.bird.height / 4, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird beak
        this.ctx.fillStyle = '#FF9800';
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.width / 2 - 5, 0);
        this.ctx.lineTo(this.bird.width / 2 + 8, 0);
        this.ctx.lineTo(this.bird.width / 2, 6);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Bird wing
        this.ctx.fillStyle = '#FFC107';
        this.ctx.beginPath();
        this.ctx.ellipse(-5, 5, 12, 8, -20 * Math.PI / 180, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Draw instructions if not started
        if (!this.isPlaying) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Fredoka';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Make NOISE to Fly! 🎤', 
                            this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawCloud(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, width / 3, height / 2, 0, 0, Math.PI * 2);
        this.ctx.ellipse(x + width / 3, y, width / 2.5, height / 1.8, 0, 0, Math.PI * 2);
        this.ctx.ellipse(x + width * 2/3, y, width / 3, height / 2, 0, 0, Math.PI * 2);
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
