// src/views/LiveTimerView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { AudioService } from '../services/audio.service';
import { ModalService } from '../services/modal.service';
import { Block, BlockType, Flow } from '../models/flow.model';
import { BLOCK_ICONS_SVG } from '../utils/icons';

interface RecordedBlock {
  type: BlockType;
  durationMinutes: number;
}

export class LiveTimerView {
  private static timerInterval: number | null = null;
  private static startTime: number = 0;
  private static elapsedSeconds: number = 0;
  private static currentBlockType: BlockType = 'ENFOQUE';
  private static recordedBlocks: RecordedBlock[] = [];
  private static isPaused: boolean = false;
  private static pausedAccumulatedSeconds: number = 0;

  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'timer-container live-timer-container';

    this.recordedBlocks = [];
    this.currentBlockType = 'ENFOQUE';
    this.isPaused = false;
    this.pausedAccumulatedSeconds = 0;
    this.startTime = Date.now();

    this.renderLayout(view, router);
    this.startTimer(view);

    return view;
  }

  private static renderLayout(view: HTMLElement, router: AppRouter) {
    const minutes = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (this.elapsedSeconds % 60).toString().padStart(2, '0');

    const typeNames: Record<BlockType, string> = {
      ENFOQUE: 'Enfoque',
      DESCANSO: 'Descanso',
      MOVIMIENTO: 'Movimiento',
      PROCRASTINAR: 'Procrastinar'
    };

    view.innerHTML = `
      <header class="timer-header">
        <span class="flow-title-upper">MODO LIBRE — EN VIVO</span>
        <div class="block-dots">
          <span class="dot active ${this.currentBlockType.toLowerCase()}"></span>
        </div>
      </header>

      <main class="clock-stage">
        <div class="circle-clock ${this.currentBlockType.toLowerCase()}">
          <svg class="ticks-svg" viewBox="0 0 100 100">
            ${Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              return `<line x1="50" y1="6" x2="50" y2="9" stroke="#2a2a30" stroke-width="1" transform="rotate(${angle} 50 50)" />`;
            }).join('')}
          </svg>

          <div class="center-time-display">
            <span class="block-type-icon">${BLOCK_ICONS_SVG[this.currentBlockType]}</span>
            <h1 class="time-digital">${minutes}:${seconds}</h1>
            <span class="block-type-name">${typeNames[this.currentBlockType]}</span>
          </div>
        </div>
      </main>

      <!-- Selector de fase activa -->
      <div class="live-phase-selector">
        <button class="phase-chip ${this.currentBlockType === 'ENFOQUE' ? 'active enfoque' : ''}" data-type="ENFOQUE">
          ⚡ Enfoque
        </button>
        <button class="phase-chip ${this.currentBlockType === 'DESCANSO' ? 'active descanso' : ''}" data-type="DESCANSO">
          ☕ Descanso
        </button>
        <button class="phase-chip ${this.currentBlockType === 'MOVIMIENTO' ? 'active movimiento' : ''}" data-type="MOVIMIENTO">
          📈 Movimiento
        </button>
        <button class="phase-chip ${this.currentBlockType === 'PROCRASTINAR' ? 'active procrastinar' : ''}" data-type="PROCRASTINAR">
          🎮 Procrastinar
        </button>
      </div>

      <footer class="timer-controls">
        <button class="control-btn side-btn" id="btn-cancel-live" title="Cancelar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
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

        <button class="btn-gold-pill" id="btn-finish-live" style="padding: 0.6rem 1rem;">
          ✓ Guardar Flujo
        </button>
      </footer>
    `;

    this.bindEvents(view, router);
  }

  private static startTimer(view: HTMLElement) {
    this.clearTimer();

    this.timerInterval = window.setInterval(() => {
      if (this.isPaused) return;

      const now = Date.now();
      this.elapsedSeconds = this.pausedAccumulatedSeconds + Math.floor((now - this.startTime) / 1000);
      
      const digital = view.querySelector('.time-digital');
      if (digital) {
        const minutes = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (this.elapsedSeconds % 60).toString().padStart(2, '0');
        digital.textContent = `${minutes}:${seconds}`;
      }
    }, 250);
  }

  private static switchPhase(newType: BlockType, view: HTMLElement, router: AppRouter) {
    if (newType === this.currentBlockType) return;

    const durationMin = Math.max(1, Math.round(this.elapsedSeconds / 60));
    this.recordedBlocks.push({
      type: this.currentBlockType,
      durationMinutes: durationMin
    });

    AudioService.playBlockEndSound(this.currentBlockType);

    this.currentBlockType = newType;
    this.pausedAccumulatedSeconds = 0;
    this.elapsedSeconds = 0;
    this.startTime = Date.now();

    this.renderLayout(view, router);
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    // Cambio de fase manual
    view.querySelectorAll('.phase-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-type') as BlockType;
        this.switchPhase(type, view, router);
      });
    });

    // Pausa / Reanudar
    view.querySelector('#btn-toggle-pause')?.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.pausedAccumulatedSeconds = this.elapsedSeconds;
      } else {
        this.startTime = Date.now();
      }
      this.renderLayout(view, router);
    });

    // Cancelar
    view.querySelector('#btn-cancel-live')?.addEventListener('click', async () => {
      const confirmed = await ModalService.confirm('Cancelar sesión', '¿Deseas salir sin guardar la sesión?', '⚠️');
      if (confirmed) {
        this.clearTimer();
        router.navigate('home');
      }
    });

    // Guardar flujo
    view.querySelector('#btn-finish-live')?.addEventListener('click', async () => {
      this.clearTimer();

      const durationMin = Math.max(1, Math.round(this.elapsedSeconds / 60));
      this.recordedBlocks.push({
        type: this.currentBlockType,
        durationMinutes: durationMin
      });

      AudioService.playFlowCompleteSound();

      const flowName = prompt('Nombre para este nuevo flujo:') || `Flujo Libre ${new Date().toLocaleDateString('es-ES')}`;

      const blocks: Block[] = this.recordedBlocks.map((b, idx) => ({
        id: crypto.randomUUID(),
        type: b.type,
        durationMinutes: b.durationMinutes,
        position: idx
      }));

      const newFlow: Flow = {
        id: crypto.randomUUID(),
        name: flowName.trim(),
        blocks: blocks,
        createdAt: new Date().toISOString()
      };

      StorageService.saveFlow(newFlow);

      await ModalService.alert('¡Flujo Creado!', `Se ha guardado "${newFlow.name}" en tu lista de flujos.`, '🎉');
      router.navigate('home');
    });
  }

  private static clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}