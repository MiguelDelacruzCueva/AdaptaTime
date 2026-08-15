// src/views/ActiveTimerView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { Flow, Block } from '../models/flow.model';
import { BLOCK_ICONS_SVG } from '../utils/icons';
import { AudioService } from '../services/audio.service';
import { TauriService } from '../services/tauri.service';


export class ActiveTimerView {
  private static flow: Flow | null = null;
  private static currentBlockIndex: number = 0;
  private static timeRemainingSeconds: number = 0;
  private static timerInterval: number | null = null;
  private static isRunning: boolean = true;
  private static router: AppRouter;

  static render(router: AppRouter, params: Record<string, unknown> = {}): HTMLElement {
    this.router = router;
    const view = document.createElement('div');
    view.className = 'mini-widget-container';
    view.setAttribute('data-tauri-drag-region', 'true');

    // Activar modo mini flotante en Tauri
    TauriService.enterMiniMode();

    const flowId = params.flowId as string;
    const flows = StorageService.getFlows();
    this.flow = flows.find(f => f.id === flowId) || flows[0] || null;

    if (!this.flow || this.flow.blocks.length === 0) {
      this.exitToHome();
      return view;
    }

    this.currentBlockIndex = 0;
    this.initCurrentBlock();

    this.renderWidget(view);
    this.startTimer(view);

    return view;
  }

  private static initCurrentBlock() {
    if (!this.flow) return;
    const block = this.flow.blocks[this.currentBlockIndex];
    this.timeRemainingSeconds = block.durationMinutes * 60;
  }

  private static renderWidget(view: HTMLElement) {
    if (!this.flow) return;
    const currentBlock = this.flow.blocks[this.currentBlockIndex];
    const nextBlock: Block | undefined = this.flow.blocks[this.currentBlockIndex + 1];
    const blockTypeLower = currentBlock.type.toLowerCase();

    view.innerHTML = `
      <!-- Encabezado con soporte Drag para mover la mini-ventana -->
      <div class="mini-header" data-tauri-drag-region="true">
        <div class="mini-badge ${blockTypeLower}">
          ${BLOCK_ICONS_SVG[currentBlock.type]}
          <span>${currentBlock.type.charAt(0) + currentBlock.type.slice(1).toLowerCase()}</span>
        </div>
        <div class="mini-actions">
          <button class="mini-close-btn" id="btn-close-mini" title="Cerrar y volver al inicio">✕</button>
        </div>
      </div>

      <!-- Tiempo digital con color característico -->
      <div class="mini-timer-time ${blockTypeLower}" id="mini-time-text">
        ${this.formatTime(this.timeRemainingSeconds)}
      </div>

      <!-- Próxima acción -->
      <div class="mini-next-info">
        ${nextBlock ? `
          <span>Siguiente:</span>
          <span style="display:inline-flex; align-items:center; gap:3px;">
            ${BLOCK_ICONS_SVG[nextBlock.type]} ${nextBlock.type.charAt(0) + nextBlock.type.slice(1).toLowerCase()} (${nextBlock.durationMinutes}m)
          </span>
        ` : '<span>Último bloque del flujo</span>'}
      </div>

      <!-- Controles esenciales -->
      <div class="mini-controls-row">
        <button class="mini-ctrl-btn" id="btn-reset-block" title="Reiniciar bloque">↺</button>
        <button class="mini-play-btn ${blockTypeLower}" id="btn-toggle-play" title="${this.isRunning ? 'Pausar' : 'Reanudar'}">
          ${this.isRunning ? '⏸' : '▶'}
        </button>
        <button class="mini-ctrl-btn" id="btn-skip-block" title="Siguiente bloque">⏭</button>
      </div>
    `;

    this.bindEvents(view);
  }

  private static bindEvents(view: HTMLElement) {
    // Cerrar / Detener y restaurar tamaño
    view.querySelector('#btn-close-mini')?.addEventListener('click', () => {
      this.stopTimer();
      this.exitToHome();
    });

    // Play / Pausa
    view.querySelector('#btn-toggle-play')?.addEventListener('click', () => {
      this.isRunning = !this.isRunning;
      const playBtn = view.querySelector('#btn-toggle-play');
      if (playBtn) playBtn.textContent = this.isRunning ? '⏸' : '▶';
    });

    // Reiniciar bloque actual
    view.querySelector('#btn-reset-block')?.addEventListener('click', () => {
      this.initCurrentBlock();
      this.updateTimeDisplay(view);
    });

    // Saltar al siguiente bloque
    view.querySelector('#btn-skip-block')?.addEventListener('click', () => {
      this.nextBlock(view);
    });
  }

  private static startTimer(view: HTMLElement) {
    this.stopTimer();
    this.isRunning = true;

    this.timerInterval = window.setInterval(() => {
      if (!this.isRunning) return;

      if (this.timeRemainingSeconds > 0) {
        this.timeRemainingSeconds--;
        this.updateTimeDisplay(view);
      } else {
        AudioService.playNotificationSound();
        const currentBlock = this.flow?.blocks[this.currentBlockIndex];
        if (currentBlock) {
          TauriService.notifyBlockFinished(
            '¡Bloque completado!',
            `Has terminado ${currentBlock.type.toLowerCase()} de ${currentBlock.durationMinutes}m.`
          );
        }
        this.nextBlock(view);
      }
    }, 1000);
  }

  private static nextBlock(view: HTMLElement) {
    if (!this.flow) return;

    if (this.currentBlockIndex < this.flow.blocks.length - 1) {
      this.currentBlockIndex++;
      this.initCurrentBlock();
      this.renderWidget(view);
    } else {
      // Fin del flujo completo
      this.stopTimer();
      type BlockType = /*unresolved*/ any;
      const breakdown: Record<BlockType, number> = {
        ENFOQUE: 0, DESCANSO: 0, MOVIMIENTO: 0, PROCRASTINAR: 0
      };
      let totalMinutes = 0;
      this.flow.blocks.forEach(b => {
        breakdown[b.type] += b.durationMinutes;
        totalMinutes += b.durationMinutes;
      });
      StorageService.recordSession({
        id: crypto.randomUUID(),
        flowId: this.flow.id,
        flowName: this.flow.name,
        completedAt: new Date().toISOString(),
        totalDurationMinutes: totalMinutes,
        breakdown: breakdown
      });
      AudioService.playNotificationSound();
      TauriService.notifyBlockFinished('¡Flujo terminado!', `Has completado "${this.flow.name}". ¡Excelente trabajo!`);
      this.exitToHome();
    }
  }

  private static updateTimeDisplay(view: HTMLElement) {
    const timeText = view.querySelector('#mini-time-text');
    if (timeText) {
      timeText.textContent = this.formatTime(this.timeRemainingSeconds);
    }
  }

  private static stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private static async exitToHome() {
    this.stopTimer();
    await TauriService.exitMiniMode();
    this.router.navigate('home');
  }

  private static formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}