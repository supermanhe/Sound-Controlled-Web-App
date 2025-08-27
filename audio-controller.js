class AudioController {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isListening = false;
        this.volumeCallback = null;
        this.frequencyCallback = null;
        this.pitchCallback = null;
        this.animationId = null;
    }

    async initialize() {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect microphone to analyser
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            // Create data array for frequency data
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            alert('Please allow microphone access to play!');
            return false;
        }
    }

    startListening() {
        if (!this.isListening && this.audioContext) {
            this.isListening = true;
            this.analyze();
        }
    }

    stopListening() {
        this.isListening = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    analyze() {
        if (!this.isListening) return;

        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate volume (RMS)
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;
        const volume = Math.min(100, (average / 255) * 100 * 2); // Normalize to 0-100
        
        // Calculate dominant frequency
        let maxIndex = 0;
        let maxValue = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }
        const nyquist = this.audioContext.sampleRate / 2;
        const frequency = (maxIndex * nyquist) / this.dataArray.length;
        
        // Calculate pitch (simplified)
        const pitch = this.frequencyToPitch(frequency);
        
        // Trigger callbacks
        if (this.volumeCallback) this.volumeCallback(volume);
        if (this.frequencyCallback) this.frequencyCallback(frequency);
        if (this.pitchCallback) this.pitchCallback(pitch);
        
        // Update UI
        this.updateVolumeIndicator(volume);
        
        this.animationId = requestAnimationFrame(() => this.analyze());
    }

    frequencyToPitch(frequency) {
        // Convert frequency to a simplified pitch value (0-100)
        if (frequency < 100) return 0;
        if (frequency > 2000) return 100;
        return ((frequency - 100) / 1900) * 100;
    }

    updateVolumeIndicator(volume) {
        const volumeLevel = document.getElementById('volumeLevel');
        const soundStatus = document.getElementById('soundStatus');
        
        if (volumeLevel) {
            volumeLevel.style.width = `${volume}%`;
        }
        
        if (soundStatus) {
            if (volume > 60) {
                soundStatus.textContent = '🔊 Loud!';
            } else if (volume > 30) {
                soundStatus.textContent = '🎤 Speaking';
            } else if (volume > 10) {
                soundStatus.textContent = '🔈 Detected';
            } else {
                soundStatus.textContent = '🎤 Ready';
            }
        }
    }

    onVolume(callback) {
        this.volumeCallback = callback;
    }

    onFrequency(callback) {
        this.frequencyCallback = callback;
    }

    onPitch(callback) {
        this.pitchCallback = callback;
    }

    destroy() {
        this.stopListening();
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Create global audio controller instance
const audioController = new AudioController();
