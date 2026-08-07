// src/views/LiveTimerView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { AudioService } from '../services/audio.service';
import { ModalService } from '../services/modal.service';
import { Block, BlockType, Flow } from '../models/flow.model';
import { BLOCK_ICONS_SVG } from '../utils/icons';

export class LiveTimerView {
  private static timerInterval: number | null = null;
  private static isStarted: boolean = false;
  private static isPaused: boolean = false;
  private static activeType: BlockType | null = null;

  // Tiempos acumulados en segundos por categoría
  private static accumulatedSeconds: Record<BlockType, number> = {
    ENFOQUE: 0,
    DESCANSO: 0,
    MOVIMIENTO: 0,
    PROCRASTINAR: 0
  };

  private static currentPhaseStartTime: number = 0;
  private static currentPhaseElapsedSeconds: number = 0;

  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'live-cronometer-container';

    this.resetState();
    this.renderContent(view, router);

    return view;
  }

  private static resetState() {
    this.clearTimer();
    this.isStarted = false;
    this.isPaused = false;
    this.activeType = null;
    this.accumulatedSeconds = { ENFOQUE: 0, DESCANSO: 0, MOVIMIENTO: 0, PROCRASTINAR: 0 };
    this.currentPhaseStartTime = 0;
    this.currentPhaseElapsedSeconds = 0;
  }

  private static renderContent(view: HTMLElement, router: AppRouter) {
    const totalSeconds = this.getTotalSeconds();
    const formattedClock = this.formatDigitalClock(totalSeconds);

    const typeNames: Record<BlockType, string> = {
      ENFOQUE: 'Enfoque',
      DESCANSO: 'Descanso',
      MOVIMIENTO: 'Movimiento',
      PROCRASTINAR: 'Procrastinar'
    };

    // Subtítulo debajo del reloj
    let subtextHTML = '';
    if (!this.isStarted) {
      subtextHTML = `<span class="clock-subtext muted">selecciona una acción para empezar</span>`;
    } else if (this.isPaused) {
      subtextHTML = `<span class="clock-subtext muted">en pausa</span>`;
    } else if (this.activeType) {
      subtextHTML = `
        <span class="clock-subtext active-action ${this.activeType.toLowerCase()}">
          ${BLOCK_ICONS_SVG[this.activeType]} ${typeNames[this.activeType]}
        </span>
      `;
    }

    // Cálculo de porcentaje para la barra
    const categoryTotals = this.getCategoryTotalsWithLive();
    const categoriesWithTime = (Object.keys(categoryTotals) as BlockType[]).filter(t => categoryTotals[t] > 0);

    view.innerHTML = `
      <!-- Encabezado -->
      <header class="live-header">
        <div class="live-header-left">
          <button class="icon-btn" id="btn-back-home" title="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 class="serif-title page-title-live">Cronómetro libre</h2>
        </div>

        <div class="live-header-right">
          ${this.isStarted ? `
            <button class="btn-gold-pill" id="btn-save-session">
              ✓ Guardar sesión
            </button>
          ` : ''}
        </div>
      </header>

      <!-- Reloj Digital Central -->
      <main class="live-body">
        <div class="digital-display-wrapper">
          <h1 class="digital-clock-large">${formattedClock}</h1>
          ${subtextHTML}
        </div>

        <!-- Barra Proporcional de Progreso Dinámico -->
        <div class="live-bar-wrapper">
          <div class="live-bar-track">
            ${totalSeconds === 0 ? `
              <div class="live-bar-empty"></div>
            ` : `
              ${categoriesWithTime.map(type => {
                const pct = (categoryTotals[type] / totalSeconds) * 100;
                return `<div class="bar-segment ${type.toLowerCase()}" style="width: ${pct}%"></div>`;
              }).join('')}
            `}
          </div>

          <!-- Leyenda con tiempos consumidos debajo de la barra -->
          <div class="live-bar-legend">
            ${categoriesWithTime.map(type => `
              <div class="legend-chip ${type.toLowerCase()}">
                ${BLOCK_ICONS_SVG[type]}
                <span>${typeNames[type]}</span>
                <strong>${this.formatShortDuration(categoryTotals[type])}</strong>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Selector de Acciones -->
        <section class="action-grid-section">
          <span class="grid-section-title">
            ${this.isStarted ? 'CAMBIAR ACCIÓN' : 'COMENZAR CON'}
          </span>

          <div class="actions-grid-2x2">
            ${(Object.keys(typeNames) as BlockType[]).map(type => {
              const isActive = this.activeType === type && !this.isPaused;
              const timeSec = categoryTotals[type];

              return `
                <button class="action-card ${type.toLowerCase()} ${isActive ? 'active-card' : ''}" data-type="${type}">
                  <div class="card-left-content">
                    <span class="card-icon">${BLOCK_ICONS_SVG[type]}</span>
                    <div class="card-text-col">
                      <span class="card-title">${typeNames[type]}</span>
                      ${timeSec > 0 ? `<span class="card-time-spent">${this.formatCardDuration(timeSec)}</span>` : ''}
                    </div>
                  </div>
                  ${isActive ? `<span class="active-dot"></span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Controles Inferiores -->
        <footer class="live-footer-controls">
          ${this.isStarted ? `
            <button class="control-icon-btn" id="btn-toggle-pause" title="${this.isPaused ? 'Reanudar' : 'Pausar'}">
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

            <button class="control-icon-btn" id="btn-stop-session" title="Detener">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>

            <button class="text-control-btn" id="btn-reset-session">
              Reiniciar
            </button>
          ` : ''}
        </footer>
      </main>
    `;

    this.bindEvents(view, router);
  }

  private static startOrSwitchAction(type: BlockType, view: HTMLElement, router: AppRouter) {
    const now = Date.now();

    // Si ya había una acción corriendo, guardamos sus segundos acumulados
    if (this.activeType && !this.isPaused) {
      this.accumulatedSeconds[this.activeType] += this.currentPhaseElapsedSeconds;
    }

    AudioService.playBlockEndSound(type);

    this.activeType = type;
    this.isStarted = true;
    this.isPaused = false;
    this.currentPhaseStartTime = now;
    this.currentPhaseElapsedSeconds = 0;

    this.renderContent(view, router);
    this.startTimerLoop(view);
  }

  private static startTimerLoop(view: HTMLElement) {
    this.clearTimer();

    this.timerInterval = window.setInterval(() => {
      if (this.isPaused || !this.activeType) return;

      const now = Date.now();
      const elapsed = Math.floor((now - this.currentPhaseStartTime) / 1000);

      if (elapsed !== this.currentPhaseElapsedSeconds) {
        this.currentPhaseElapsedSeconds = elapsed;
        this.updateLiveUI(view);
      }
    }, 250);
  }

  private static updateLiveUI(view: HTMLElement) {
    const totalSeconds = this.getTotalSeconds();
    const formattedClock = this.formatDigitalClock(totalSeconds);

    const digitalClock = view.querySelector('.digital-clock-large');
    if (digitalClock) digitalClock.textContent = formattedClock;

    const categoryTotals = this.getCategoryTotalsWithLive();
    const categoriesWithTime = (Object.keys(categoryTotals) as BlockType[]).filter(t => categoryTotals[t] > 0);

    // Actualizar Barra
    const track = view.querySelector('.live-bar-track');
    if (track && totalSeconds > 0) {
      track.innerHTML = categoriesWithTime.map(type => {
        const pct = (categoryTotals[type] / totalSeconds) * 100;
        return `<div class="bar-segment ${type.toLowerCase()}" style="width: ${pct}%"></div>`;
      }).join('');
    }

    // Actualizar Leyenda
    const legend = view.querySelector('.live-bar-legend');
    if (legend) {
      const typeNames: Record<BlockType, string> = {
        ENFOQUE: 'Enfoque', DESCANSO: 'Descanso', MOVIMIENTO: 'Movimiento', PROCRASTINAR: 'Procrastinar'
      };

      legend.innerHTML = categoriesWithTime.map(type => `
        <div class="legend-chip ${type.toLowerCase()}">
          ${BLOCK_ICONS_SVG[type]}
          <span>${typeNames[type]}</span>
          <strong>${this.formatShortDuration(categoryTotals[type])}</strong>
        </div>
      `).join('');
    }

    // Actualizar tiempo en la tarjeta activa
    if (this.activeType) {
      const activeCard = view.querySelector(`.action-card.${this.activeType.toLowerCase()}`);
      const timeSpentSpan = activeCard?.querySelector('.card-time-spent');
      if (timeSpentSpan) {
        timeSpentSpan.textContent = this.formatCardDuration(categoryTotals[this.activeType]);
      }
    }
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    // Volver
    view.querySelector('#btn-back-home')?.addEventListener('click', async () => {
      if (this.isStarted && this.getTotalSeconds() > 0) {
        const confirmed = await ModalService.confirm('Salir', '¿Deseas salir del cronómetro libre?', '⚠️');
        if (!confirmed) return;
      }
      this.clearTimer();
      router.navigate('home');
    });

    // Clic en tarjetas de acción
    view.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-type') as BlockType;
        this.startOrSwitchAction(type, view, router);
      });
    });

    // Pausar / Reanudar
    view.querySelector('#btn-toggle-pause')?.addEventListener('click', () => {
      this.isPaused = !this.isPaused;

      if (this.isPaused) {
        if (this.activeType) {
          this.accumulatedSeconds[this.activeType] += this.currentPhaseElapsedSeconds;
        }
        this.currentPhaseElapsedSeconds = 0;
      } else {
        this.currentPhaseStartTime = Date.now();
        this.currentPhaseElapsedSeconds = 0;
      }

      this.renderContent(view, router);
    });

    // Reiniciar
    view.querySelector('#btn-reset-session')?.addEventListener('click', async () => {
      const confirmed = await ModalService.confirm('Reiniciar', '¿Deseas reiniciar el cronómetro a cero?', '🔄');
      if (confirmed) {
        this.resetState();
        this.renderContent(view, router);
      }
    });

    // Detener
    view.querySelector('#btn-stop-session')?.addEventListener('click', () => {
      if (this.activeType && !this.isPaused) {
        this.accumulatedSeconds[this.activeType] += this.currentPhaseElapsedSeconds;
      }
      this.isPaused = true;
      this.currentPhaseElapsedSeconds = 0;
      this.renderContent(view, router);
    });

    // Guardar Sesión
    view.querySelector('#btn-save-session')?.addEventListener('click', async () => {
      if (this.activeType && !this.isPaused) {
        this.accumulatedSeconds[this.activeType] += this.currentPhaseElapsedSeconds;
      }

      this.clearTimer();
      AudioService.playFlowCompleteSound();

      const totals = this.accumulatedSeconds;
      const blocks: Block[] = (Object.keys(totals) as BlockType[])
        .filter(t => totals[t] > 0)
        .map((t, idx) => ({
          id: crypto.randomUUID(),
          type: t,
          durationMinutes: Math.max(1, Math.round(totals[t] / 60)),
          position: idx
        }));

      if (blocks.length === 0) {
        await ModalService.alert('Sin tiempo', 'Debes registrar tiempo antes de guardar.', '⚠️');
        return;
      }

      const flowName = prompt('Nombre para este nuevo flujo:') || `Flujo Libre ${new Date().toLocaleDateString('es-ES')}`;

      const newFlow: Flow = {
        id: crypto.randomUUID(),
        name: flowName.trim(),
        blocks: blocks,
        createdAt: new Date().toISOString()
      };

      StorageService.saveFlow(newFlow);

      await ModalService.alert('¡Sesión guardada!', `Se ha guardado "${newFlow.name}" en tus flujos.`, '🎉');
      router.navigate('home');
    });
  }

  // --- Auxiliares de Cálculo y Formato ---
  private static getCategoryTotalsWithLive(): Record<BlockType, number> {
    const copy = { ...this.accumulatedSeconds };
    if (this.activeType && !this.isPaused) {
      copy[this.activeType] += this.currentPhaseElapsedSeconds;
    }
    return copy;
  }

  private static getTotalSeconds(): number {
    const totals = this.getCategoryTotalsWithLive();
    return Object.values(totals).reduce((a, b) => a + b, 0);
  }

  private static formatDigitalClock(sec: number): string {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private static formatShortDuration(sec: number): string {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  private static formatCardDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }

  private static clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}