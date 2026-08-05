// src/views/ActiveTimerView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { AudioService } from '../services/audio.service';
import { TauriService } from '../services/tauri.service';
import { Flow, BlockType } from '../models/flow.model';
import { BLOCK_ICONS_SVG } from '../utils/icons';

export class ActiveTimerView {
  private static timerInterval: number | null = null;
  private static currentFlow: Flow | null = null;
  private static currentBlockIndex: number = 0;
  
  // Variables del Motor de Tiempo Preciso
  private static totalBlockSeconds: number = 0;
  private static remainingSeconds: number = 0;
  private static endTime: number = 0;
  private static isPaused: boolean = false;

  static render(router: AppRouter, params: Record<string, unknown> = {}): HTMLElement {
    const view = document.createElement('div');
    view.className = 'timer-container';

    const flowId = params.flowId as string;
    const flows = StorageService.getFlows();
    this.currentFlow = flows.find(f => f.id === flowId) || null;

    if (!this.currentFlow || this.currentFlow.blocks.length === 0) {
      alert('Flujo no encontrado.');
      router.navigate('home');
      return view;
    }

    this.currentBlockIndex = 0;
    this.isPaused = false;
    this.setupCurrentBlock();

    this.renderLayout(view, router);
    this.startTimer(view, router);

    return view;
  }

  private static setupCurrentBlock() {
    if (!this.currentFlow) return;
    const block = this.currentFlow.blocks[this.currentBlockIndex];
    this.totalBlockSeconds = block.durationMinutes * 60;
    this.remainingSeconds = this.totalBlockSeconds;
    this.resetTargetEndTime();
  }

  private static resetTargetEndTime() {
    // La hora de finalización exacta = Hora actual + Segundos restantes acumulados
    this.endTime = Date.now() + this.remainingSeconds * 1000;
  }

  private static renderLayout(view: HTMLElement, router: AppRouter) {
    if (!this.currentFlow) return;

    const currentBlock = this.currentFlow.blocks[this.currentBlockIndex];
    const nextBlock = this.currentFlow.blocks[this.currentBlockIndex + 1];

    const typeNames: Record<BlockType, string> = {
      ENFOQUE: 'Enfoque',
      DESCANSO: 'Descanso',
      MOVIMIENTO: 'Movimiento',
      PROCRASTINAR: 'Procrastinar'
    };

    const elapsedSeconds = this.totalBlockSeconds - this.remainingSeconds;
    const rotationDegrees = (elapsedSeconds / this.totalBlockSeconds) * 360;

    const minutes = Math.floor(this.remainingSeconds / 60).toString().padStart(2, '0');
    const seconds = (this.remainingSeconds % 60).toString().padStart(2, '0');

    view.innerHTML = `
      <header class="timer-header">
        <span class="flow-title-upper">FLUJO — ${this.currentFlow.name}</span>
        <div class="block-dots">
          ${this.currentFlow.blocks.map((b, idx) => `
            <span class="dot ${b.type.toLowerCase()} ${idx === this.currentBlockIndex ? 'active' : ''}"></span>
          `).join('')}
        </div>
      </header>

      <main class="clock-stage">
        <div class="circle-clock ${currentBlock.type.toLowerCase()}">
          <svg class="ticks-svg" viewBox="0 0 100 100">
            ${Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              return `<line x1="50" y1="6" x2="50" y2="9" stroke="#2a2a30" stroke-width="1" transform="rotate(${angle} 50 50)" />`;
            }).join('')}
          </svg>

          <div class="needle-wrapper" style="transform: rotate(${rotationDegrees}deg);">
            <div class="needle-hand"></div>
          </div>

          <div class="center-time-display">
            <span class="block-type-icon">${BLOCK_ICONS_SVG[currentBlock.type]}</span>
            <h1 class="time-digital">${minutes}:${seconds}</h1>
            <span class="block-type-name">${typeNames[currentBlock.type]}</span>
          </div>
        </div>
      </main>

      <footer class="timer-controls">
        <button class="control-btn side-btn" id="btn-stop" title="Detener">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        </button>

        <button class="control-btn play-pause-btn" id="btn-toggle-pause">
          ${this.isPaused ? `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          ` : `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          `}
        </button>

        <button class="control-btn side-btn" id="btn-skip" title="Siguiente bloque">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 4l10 8-10 8V4z" fill="currentColor" />
            <line x1="19" y1="5" x2="19" y2="19" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </button>
      </footer>

      <div class="next-block-preview">
        ${nextBlock ? `
          Siguiente: <span>${BLOCK_ICONS_SVG[nextBlock.type]} ${typeNames[nextBlock.type]} ${nextBlock.durationMinutes}m</span>
        ` : `
          <span>Último bloque del flujo</span>
        `}
      </div>
    `;

    this.bindEvents(view, router);
  }

  private static startTimer(view: HTMLElement, router: AppRouter) {
    this.clearTimer();

    // Verificamos con frecuencia alta (250ms) comparando la hora real del sistema
    this.timerInterval = window.setInterval(() => {
      if (this.isPaused) return;

      const now = Date.now();
      const secondsLeft = Math.max(0, Math.ceil((this.endTime - now) / 1000));

      if (secondsLeft !== this.remainingSeconds) {
        this.remainingSeconds = secondsLeft;
        this.updateClockUI(view);
      }

      if (secondsLeft <= 0) {
        const completedBlock = this.currentFlow!.blocks[this.currentBlockIndex];
        const nextBlock = this.currentFlow!.blocks[this.currentBlockIndex + 1];

        // Sonido armónico limpio
        AudioService.playBlockEndSound(completedBlock.type);

        // Notificación de SO
        TauriService.notifyBlockFinished(
          `¡Bloque de ${completedBlock.type.toLowerCase()} completado!`,
          nextBlock 
            ? `Siguiente: ${nextBlock.type} (${nextBlock.durationMinutes}m)` 
            : '¡Has finalizado todo el flujo!'
        );

        if (this.currentBlockIndex < this.currentFlow!.blocks.length - 1) {
          this.currentBlockIndex++;
          this.setupCurrentBlock();
          this.renderLayout(view, router);
        } else {
          this.clearTimer();
          this.saveCompletedSession();
          alert('¡Flujo completado con éxito!');
          router.navigate('home');
        }
      }
    }, 250);
  }

  private static updateClockUI(view: HTMLElement) {
    const elapsedSeconds = this.totalBlockSeconds - this.remainingSeconds;
    const rotationDegrees = (elapsedSeconds / this.totalBlockSeconds) * 360;

    const minutes = Math.floor(this.remainingSeconds / 60).toString().padStart(2, '0');
    const seconds = (this.remainingSeconds % 60).toString().padStart(2, '0');

    const digital = view.querySelector('.time-digital');
    const needle = view.querySelector('.needle-wrapper') as HTMLElement;

    if (digital) digital.textContent = `${minutes}:${seconds}`;
    if (needle) needle.style.transform = `rotate(${rotationDegrees}deg)`;
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    view.querySelector('#btn-toggle-pause')?.addEventListener('click', () => {
      this.isPaused = !this.isPaused;

      if (!this.isPaused) {
        // Al reanudar, recalculamos el tiempo final proyectado
        this.resetTargetEndTime();
      }

      this.renderLayout(view, router);
    });

    view.querySelector('#btn-skip')?.addEventListener('click', () => {
      if (this.currentFlow && this.currentBlockIndex < this.currentFlow.blocks.length - 1) {
        this.currentBlockIndex++;
        this.setupCurrentBlock();
        this.renderLayout(view, router);
      } else {
        this.clearTimer();
        this.saveCompletedSession();
        router.navigate('home');
      }
    });

    view.querySelector('#btn-stop')?.addEventListener('click', () => {
      this.clearTimer();
      router.navigate('home');
    });
  }

  private static clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private static saveCompletedSession() {
    if (!this.currentFlow) return;
    const totalMin = this.currentFlow.blocks.reduce((acc, b) => acc + b.durationMinutes, 0);

    StorageService.addHistoryEntry({
      id: crypto.randomUUID(),
      flowId: this.currentFlow.id,
      flowName: this.currentFlow.name,
      totalDurationMinutes: totalMin,
      completedBlocks: this.currentFlow.blocks.length,
      totalBlocks: this.currentFlow.blocks.length,
      completedAt: new Date().toISOString()
    });
  }
}