// src/views/LiveTimerView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { BlockType } from '../models/flow.model';
import { BLOCK_ICONS_SVG } from '../utils/icons';
import { AudioService } from '../services/audio.service';
import { ModalService } from '../services/modal.service';

export class LiveTimerView {
  private static currentAction: BlockType | null = null;
  private static isRunning: boolean = false;
  private static timerInterval: number | null = null;

  // Tiempo acumulado por cada tipo de bloque (en segundos)
  private static timeSpent: Record<BlockType, number> = {
    ENFOQUE: 0,
    DESCANSO: 0,
    MOVIMIENTO: 0,
    PROCRASTINAR: 0,
  };

  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'live-cronometer-container';

    this.renderContent(view, router);
    return view;
  }

  private static renderContent(view: HTMLElement, router: AppRouter) {
    const totalSeconds = this.getTotalSeconds();
    const actionLower = this.currentAction ? this.currentAction.toLowerCase() : '';

    view.innerHTML = `
      <header class="live-header">
        <div class="live-header-left">
          <button class="control-icon-btn" id="btn-back-home" title="Volver al inicio">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 class="page-title-live">Cronómetro libre</h2>
        </div>
      </header>

      <main class="live-body">
        <!-- Display de Tiempo Digital -->
        <div class="digital-display-wrapper">
          <h1 class="digital-clock-large" id="live-digital-clock">
            ${this.formatTime(totalSeconds)}
          </h1>
          <div class="clock-subtext ${this.currentAction ? `active-action ${actionLower}` : 'muted'}" id="live-status-subtext">
            ${
              this.currentAction
                ? `En curso: ${this.currentAction.charAt(0) + this.currentAction.slice(1).toLowerCase()}`
                : 'selecciona una acción para empezar'
            }
          </div>
        </div>

        <!-- Barra Dinámica de Porcentaje -->
        <div class="live-bar-wrapper">
          <div class="live-bar-track" id="live-bar-track">
            ${this.renderBarSegments(totalSeconds)}
          </div>
          <div class="live-bar-legend">
            <div class="legend-chip enfoque">● Enfoque <span id="leg-enfoque">${this.formatMinutes(this.timeSpent.ENFOQUE)}</span></div>
            <div class="legend-chip descanso">● Descanso <span id="leg-descanso">${this.formatMinutes(this.timeSpent.DESCANSO)}</span></div>
            <div class="legend-chip movimiento">● Movimiento <span id="leg-movimiento">${this.formatMinutes(this.timeSpent.MOVIMIENTO)}</span></div>
            <div class="legend-chip procrastinar">● Procrastinar <span id="leg-procrastinar">${this.formatMinutes(this.timeSpent.PROCRASTINAR)}</span></div>
          </div>
        </div>

        <!-- Grilla de Acciones 2x2 -->
        <div class="action-grid-section">
          <span class="grid-section-title">
            ${this.isRunning || totalSeconds > 0 ? 'CAMBIAR ACCIÓN' : 'COMENZAR CON'}
          </span>

          <div class="actions-grid-2x2">
            ${this.renderActionCard('ENFOQUE', 'Enfoque')}
            ${this.renderActionCard('DESCANSO', 'Descanso')}
            ${this.renderActionCard('MOVIMIENTO', 'Movimiento')}
            ${this.renderActionCard('PROCRASTINAR', 'Procrastinar')}
          </div>
        </div>

        <!-- Controles Inferiores -->
        <div class="live-footer-controls">
          <button class="text-control-btn" id="btn-stop-live" style="${totalSeconds === 0 ? 'visibility:hidden;' : ''}">
            ⏹ Terminar
          </button>

          <button class="play-pause-btn control-btn" id="btn-toggle-live" title="${this.isRunning ? 'Pausar' : 'Reanudar'}">
            ${this.isRunning ? '⏸' : '▶'}
          </button>

          <button class="control-icon-btn" id="btn-reset-live" title="Reiniciar a 00:00" style="${totalSeconds === 0 ? 'visibility:hidden;' : ''}">
            ↺
          </button>
        </div>
      </main>
    `;

    this.bindEvents(view, router);
  }

  private static renderActionCard(type: BlockType, label: string): string {
    const isActive = this.currentAction === type;
    const typeLower = type.toLowerCase();

    return `
      <div class="action-card ${isActive ? `active-card ${typeLower}` : ''}" data-action="${type}">
        <div class="card-left-content">
          ${BLOCK_ICONS_SVG[type]}
          <div class="card-text-col">
            <span class="card-title">${label}</span>
            <span class="card-time-spent" id="card-time-${typeLower}">${this.formatTime(this.timeSpent[type])}</span>
          </div>
        </div>
        ${isActive ? '<div class="active-dot"></div>' : ''}
      </div>
    `;
  }

  private static renderBarSegments(totalSeconds: number): string {
    if (totalSeconds === 0) {
      return '<div class="live-bar-empty"></div>';
    }

    const types: BlockType[] = ['ENFOQUE', 'DESCANSO', 'MOVIMIENTO', 'PROCRASTINAR'];
    return types
      .filter((t) => this.timeSpent[t] > 0)
      .map((t) => {
        const pct = ((this.timeSpent[t] / totalSeconds) * 100).toFixed(1);
        return `<div class="bar-segment ${t.toLowerCase()}" style="width: ${pct}%" title="${t}: ${pct}%"></div>`;
      })
      .join('');
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    // Volver a Inicio
    view.querySelector('#btn-back-home')?.addEventListener('click', async () => {
      const total = this.getTotalSeconds();
      if (this.isRunning && total > 0) {
        const confirmExit = await ModalService.confirm(
          'Sesión activa',
          '¿Deseas salir del cronómetro? El tiempo no guardado se perderá.',
          '⚠️'
        );
        if (!confirmExit) return;
      }
      this.stopTimer();
      this.resetAllState();
      router.navigate('home');
    });

    // Seleccionar o alternar acción
    view.querySelectorAll('[data-action]').forEach((card) => {
      card.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).getAttribute('data-action') as BlockType;
        this.currentAction = action;

        if (!this.isRunning) {
          this.startTimer(view);
        }
        this.renderContent(view, router);
      });
    });

    // Play / Pausa
    view.querySelector('#btn-toggle-live')?.addEventListener('click', () => {
      if (!this.currentAction) {
        this.currentAction = 'ENFOQUE';
      }

      this.isRunning = !this.isRunning;
      if (this.isRunning) {
        this.startTimer(view);
      } else {
        this.stopTimer();
      }
      this.renderContent(view, router);
    });

    // Reiniciar
    view.querySelector('#btn-reset-live')?.addEventListener('click', () => {
      this.stopTimer();
      this.resetAllState();
      this.renderContent(view, router);
    });

    // Terminar y Guardar sesión
    view.querySelector('#btn-stop-live')?.addEventListener('click', async () => {
      const totalSeconds = this.getTotalSeconds();
      const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
      this.stopTimer();

      // Desglose de minutos redondeados por acción
      const breakdown: Record<BlockType, number> = {
        ENFOQUE: Math.round(this.timeSpent.ENFOQUE / 60),
        DESCANSO: Math.round(this.timeSpent.DESCANSO / 60),
        MOVIMIENTO: Math.round(this.timeSpent.MOVIMIENTO / 60),
        PROCRASTINAR: Math.round(this.timeSpent.PROCRASTINAR / 60)
      };
      StorageService.recordSession({
        id: crypto.randomUUID(),
        flowName: `Sesión libre (${this.currentAction ? this.currentAction.charAt(0) + this.currentAction.slice(1).toLowerCase() : 'Enfoque'})`,
        completedAt: new Date().toISOString(),
        totalDurationMinutes: totalMinutes,
        breakdown: breakdown // 👈 Guarda el desglose completo
      });

      AudioService.playNotificationSound();
      await ModalService.alert('Sesión registrada', `¡Sumaste ${totalMinutes}m a tu progreso diario!`, '🎉');
      this.resetAllState();
      router.navigate('home');
    });
  }

  private static startTimer(view: HTMLElement) {
    this.stopTimer();
    this.isRunning = true;

    this.timerInterval = window.setInterval(() => {
      if (!this.isRunning || !this.currentAction) return;

      this.timeSpent[this.currentAction]++;
      this.updateLiveUI(view);
    }, 1000);
  }

  private static updateLiveUI(view: HTMLElement) {
    const total = this.getTotalSeconds();

    // Reloj digital principal
    const clock = view.querySelector('#live-digital-clock');
    if (clock) clock.textContent = this.formatTime(total);

    // Tiempo específico de la tarjeta activa
    if (this.currentAction) {
      const lower = this.currentAction.toLowerCase();
      const cardTime = view.querySelector(`#card-time-${lower}`);
      if (cardTime) cardTime.textContent = this.formatTime(this.timeSpent[this.currentAction]);

      // Leyenda
      const leg = view.querySelector(`#leg-${lower}`);
      if (leg) leg.textContent = this.formatMinutes(this.timeSpent[this.currentAction]);
    }

    // Barra de segmentos dinámicos
    const track = view.querySelector('#live-bar-track');
    if (track) track.innerHTML = this.renderBarSegments(total);
  }

  private static stopTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private static resetAllState() {
    this.isRunning = false;
    this.currentAction = null;
    this.timeSpent = { ENFOQUE: 0, DESCANSO: 0, MOVIMIENTO: 0, PROCRASTINAR: 0 };
  }

  private static getTotalSeconds(): number {
    return (
      this.timeSpent.ENFOQUE +
      this.timeSpent.DESCANSO +
      this.timeSpent.MOVIMIENTO +
      this.timeSpent.PROCRASTINAR
    );
  }

  private static formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private static formatMinutes(seconds: number): string {
    const m = Math.floor(seconds / 60);
    return `${m}m`;
  }
}