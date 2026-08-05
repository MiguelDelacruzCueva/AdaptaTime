// src/services/audio.service.ts
export class AudioService {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Timbre sutil para cada bloque individual (1 nota armónica)
   */
  static playBlockEndSound(_type?: string): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now); // C6

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.3);
      osc2.stop(now + 2.3);
    } catch (e) {
      console.error('Error al reproducir audio:', e);
    }
  }

  /**
   * Acorde de finalización completa de todo el flujo (Arpegio C5 - E5 - G5)
   */
  static playFlowCompleteSound(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const frequencies = [523.25, 659.25, 783.99]; // Acorde Do Mayor

      frequencies.forEach((freq, idx) => {
        const startTime = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.1);
      });
    } catch (e) {
      console.error('Error al reproducir audio final:', e);
    }
  }
}