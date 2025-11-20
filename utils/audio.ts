class AudioController {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Initialize on user interaction usually, but we setup the class first
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  public toggleMute() {
    this.muted = !this.muted;
    if (!this.muted && this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isMuted() {
    return this.muted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  public playClick() {
    this.playTone(800, 'sine', 0.1, 0, 0.05);
  }

  public playFlag() {
    this.playTone(400, 'square', 0.1, 0, 0.05);
  }

  public playPowerup() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;
    
    const now = this.ctx.currentTime;
    this.playTone(440, 'sine', 0.2, 0, 0.1);
    this.playTone(880, 'sine', 0.4, 0.1, 0.1);
    this.playTone(1760, 'sine', 0.4, 0.2, 0.05);
  }

  public playExplode() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Noise buffer for explosion
    const bufferSize = this.ctx.sampleRate * 1.0; // 1 second
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start();
  }

  public playWin() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
    notes.forEach((freq, i) => {
      this.playTone(freq, 'triangle', 0.3, i * 0.15, 0.1);
    });
  }
}

export const audioController = new AudioController();