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
   * Reproduce un timbre armónico suave (chime/campana) al finalizar un bloque.
   */
  static playBlockEndSound(_type?: string): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Generadores de onda sinusoidal (Fundamental C5: 523.25Hz y Octava C6: 1046.5Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now);

      // Envolvente de volumen: Ataque inmediato y resonancia que se desvanece suavemente
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.6);
      osc2.stop(now + 2.6);
    } catch (e) {
      console.error('Error al reproducir audio:', e);
    }
  }
}