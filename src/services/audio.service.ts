// src/services/audio.service.ts

export class AudioService {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Reproduce un tono elegante y suave al finalizar un bloque o flujo
   */
  static playNotificationSound(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Generador de tono principal (campana)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // Nota Re (D5)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // Sube a La (A5)

      // Curva de volumen suave (Fade out)
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch {
      // Manejo silencioso si el audio está deshabilitado en el sistema
    }
  }
}