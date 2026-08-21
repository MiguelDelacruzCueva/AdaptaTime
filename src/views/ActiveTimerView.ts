// src/views/ActiveTimerView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { FlowRunnerService } from '../services/flow-runner.service';
import { TauriService } from '../services/tauri.service';
import { BLOCK_ICONS_SVG, UI_ICONS } from '../utils/icons';
import { formatTimerSeconds } from '../utils/format';

export class ActiveTimerView {
  private static unsubscribe: (() => void) | null = null;

  static render(router: AppRouter, params: Record<string, unknown> = {}): HTMLElement {
    document.querySelectorAll('.custom-modal-overlay').forEach(el => el.remove());
    const view = document.createElement('div');
    view.className = 'active-timer-pip-wrapper';

    // Si se pasa un flowId nuevo o diferente al actual, se inicia; si ya está corriendo, se mantiene intacto
   if (params.flowId) {
      const status = FlowRunnerService.getStatus();
      if (!status || status.flow.id !== params.flowId) {
        const flow = StorageService.getFlows().find(f => f.id === params.flowId);
        if (flow) FlowRunnerService.startFlow(flow);
      }
    }

    TauriService.enterMiniMode();

    const updateUI = () => {
      const status = FlowRunnerService.getStatus();
      if (!status) {
        this.destroy();
        TauriService.exitMiniMode();
        router.navigate('home');
        return;
      }

      const { flowName, currentBlockIndex, totalBlocks, currentBlock, nextBlock, secondsRemaining, isRunning } = status;
      const type = currentBlock.type;

      view.innerHTML = `
        <div class="pip-card ${type.toLowerCase()}">
          <div class="pip-topbar">
            <div class="pip-phase-tag ${type.toLowerCase()}">
              ${BLOCK_ICONS_SVG[type]}
              <span class="pip-phase-name">${type}</span>
              <span class="pip-phase-count">${currentBlockIndex + 1}/${totalBlocks}</span>
            </div>

            <div class="pip-top-actions">
              <button class="pip-icon-btn" id="btn-return-big" title="Volver a pantalla grande (sigue en marcha)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
              <button class="pip-icon-btn close" id="btn-close-session" title="Terminar flujo">
                ${UI_ICONS.close}
              </button>
            </div>
          </div>

          <div class="pip-main-body">
            <span class="pip-flow-name" title="${flowName}">${flowName}</span>
            <div class="pip-digits ${type.toLowerCase()}">
              ${formatTimerSeconds(secondsRemaining)}
            </div>
            <div class="pip-next-preview">
              ${nextBlock 
                ? `<span>Sig:</span> <span class="pip-next-highlight ${nextBlock.type.toLowerCase()}">${nextBlock.type.toLowerCase()} (${nextBlock.durationMinutes}m)</span>` 
                : `<span class="pip-next-last">Último bloque</span>`
              }
            </div>
          </div>

          <div class="pip-controls-row">
            <button class="pip-ctrl-btn" id="btn-reset-block" title="Reiniciar bloque">
              ${UI_ICONS.reset}
            </button>
            <button class="pip-play-btn ${type.toLowerCase()}" id="btn-toggle-play" title="${isRunning ? 'Pausar' : 'Reanudar'}">
              ${isRunning ? UI_ICONS.pause : UI_ICONS.play}
            </button>
            <button class="pip-ctrl-btn" id="btn-skip-block" title="Siguiente bloque">
              ${UI_ICONS.skip}
            </button>
          </div>
        </div>
      `;

      // Eventos de control
      view.querySelector('#btn-toggle-play')?.addEventListener('click', (e) => {
        e.stopPropagation();
        isRunning ? FlowRunnerService.pause() : FlowRunnerService.resume();
      });

      view.querySelector('#btn-reset-block')?.addEventListener('click', (e) => {
        e.stopPropagation();
        FlowRunnerService.resetCurrentBlock();
      });

      view.querySelector('#btn-skip-block')?.addEventListener('click', (e) => {
        e.stopPropagation();
        FlowRunnerService.nextBlock();
      });

      // Retorno fluido a la vista grande
      // Botón de retorno (vuelve a la app grande manteniendo el flujo)
    view.querySelector('#btn-return-big')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      this.destroy();
      await TauriService.exitMiniMode();
      router.navigate('home');
    });

    // Botón de cierre directo (cancela el flujo de inmediato sin pedir confirmación)
    view.querySelector('#btn-close-session')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      FlowRunnerService.stopFlow();
      this.destroy();
      await TauriService.exitMiniMode();
      router.navigate('home');
    });
    };

    // Arrastre con el ratón
    view.addEventListener('mousedown', (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      if (e.button === 0) TauriService.startDragging();
    });

    this.unsubscribe = FlowRunnerService.subscribe(updateUI);
    updateUI();
    return view;
  }

  private static destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}