// src/services/audio.service.ts
import { BlockType } from '../models/flow.model';

export class AudioService {
  private static audioCtx: AudioContext | null = null;

  private static getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Toca una nota suave (frecuencia en Hz, duración en segundos)
  private static playTone(freq: number, type: OscillatorType, duration: number) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Transición suave de volumen para evitar "clicks"
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Error reproduciendo audio:', e);
    }
  }

  // Reproduce un timbre específico según el bloque que finaliza
  static playBlockEndSound(type: BlockType) {
    switch (type) {
      case 'ENFOQUE':
        // Doblón suave (Éxito de enfoque)
        this.playTone(523.25, 'sine', 0.3); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.5), 150); // E5
        break;
      case 'DESCANSO':
      case 'MOVIMIENTO':
        // Tono relajante de descanso
        this.playTone(440, 'sine', 0.4); // A4
        setTimeout(() => this.playTone(349.23, 'sine', 0.6), 200); // F4
        break;
      case 'PROCRASTINAR':
        // Advertencia sutil
        this.playTone(220, 'triangle', 0.4); // A3
        break;
    }
  }
}