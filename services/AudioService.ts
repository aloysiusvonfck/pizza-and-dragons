class AudioService {
  private ctx: AudioContext | null = null;
  private fireInterval: number | null = null;
  private sources: Array<AudioBufferSourceNode> = [];
  private gains: Array<GainNode> = [];
  private filters: Array<BiquadFilterNode> = [];
  private oscillators: Array<OscillatorNode> = [];

  constructor() {
    // Initialize on first user interaction (browser policy)
    this.init = this.init.bind(this);
    window.addEventListener('click', this.init, { once: true });
    window.addEventListener('keydown', this.init, { once: true });
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  // --- Sound Generators ---

  playFireCrackle() {
    const ctx = this.ensureContext();
    if (this.fireInterval) return; // Already playing

    const playCrackle = () => {
      const t = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.1; // 100ms burst
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // White noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Low-pass filter to make it sound like fire (muffled)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800 + Math.random() * 400;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05 + Math.random() * 0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(t);
      this.sources.push(source);
      this.filters.push(filter);
      this.gains.push(gain);
    };

    // Loop random crackles
    this.fireInterval = window.setInterval(() => {
      if (Math.random() > 0.3) playCrackle(); // Randomize timing
    }, 200);
  }

  stopFireCrackle() {
    if (this.fireInterval) {
      clearInterval(this.fireInterval);
      this.fireInterval = null;
      this.sources.forEach((source) => source.stop());
      this.sources = [];
      this.filters.forEach((filter) => filter.disconnect());
      this.filters = [];
      this.gains.forEach((gain) => gain.disconnect());
      this.gains = [];
    }
  }

  playD20Roll() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;
    const duration = 1.5; // 1.5 seconds total
    const ticks = 12; // Number of ticks

    for (let i = 0; i < ticks; i++) {
      const time = t + (i / ticks) * duration;
      const freq = 1200 - (i * 50); // Pitch drops slightly as it slows

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.05);
      this.oscillators.push(osc);
      this.gains.push(gain);
    }
  }

  stopD20Roll() {
    this.oscillators.forEach((osc) => osc.stop());
    this.oscillators = [];
    this.gains.forEach((gain) => gain.disconnect());
    this.gains = [];
  }

  playSwordClash() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;

    // Metallic clang: Sawtooth wave with fast decay
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);

    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
    this.oscillators.push(osc);
    this.filters.push(filter);
    this.gains.push(gain);
  }

  stopSwordClash() {
    this.oscillators.forEach((osc) => osc.stop());
    this.oscillators = [];
    this.filters.forEach((filter) => filter.disconnect());
    this.filters = [];
    this.gains.forEach((gain) => gain.disconnect());
    this.gains = [];
  }

  playFireball() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;

    // Low boom with rising pitch
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(300, t + 0.5);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.8);
    this.oscillators.push(osc);
    this.gains.push(gain);
  }

  stopFireball() {
    this.oscillators.forEach((osc) => osc.stop());
    this.oscillators = [];
    this.gains.forEach((gain) => gain.disconnect());
    this.gains = [];
  }

  playSuccess() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;
    // Major chord arpeggio: C5, E5, G5
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = t + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
      this.oscillators.push(osc);
      this.gains.push(gain);
    });
  }

  stopSuccess() {
    this.oscillators.forEach((osc) => osc.stop());
    this.oscillators = [];
    this.gains.forEach((gain) => gain.disconnect());
    this.gains = [];
  }

  playFail() {
    const ctx = this.ensureContext();
    const t = ctx.currentTime;

    // Dull thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
    this.oscillators.push(osc);
    this.gains.push(gain);
  }

  stopFail() {
    this.oscillators.forEach((osc) => osc.stop());
    this.oscillators = [];
    this.gains.forEach((gain) => gain.disconnect());
    this.gains = [];
  }
}

export const audioService = new AudioService();