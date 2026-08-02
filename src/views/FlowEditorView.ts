// src/views/FlowEditorView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { Flow, Block, BlockType } from '../models/flow.model';

export class FlowEditorView {
  private static currentBlocks: Block[] = [];
  private static flowName: string = '';

  static render(router: AppRouter, params: Record<string, unknown> = {}): HTMLElement {
    const view = document.createElement('div');
    view.className = 'editor-container';

    // Si pasamos un flowId en params, editamos un flujo existente; si no, creamos uno nuevo con un bloque por defecto.
    const flowId = params.flowId as string | undefined;
    if (flowId) {
      const existing = StorageService.getFlows().find(f => f.id === flowId);
      if (existing) {
        this.flowName = existing.name;
        this.currentBlocks = [...existing.blocks];
      }
    } else {
      this.flowName = '';
      this.currentBlocks = [
        { id: crypto.randomUUID(), type: 'ENFOQUE', durationMinutes: 25, position: 1 }
      ];
    }

    this.updateView(view, router, flowId);
    return view;
  }

  private static calculateTotalMinutes(): number {
    return this.currentBlocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  }

  private static updateView(view: HTMLElement, router: AppRouter, editingId?: string) {
    const totalMinutes = this.calculateTotalMinutes();

    view.innerHTML = `
      <!-- Topbar del Editor -->
      <header class="editor-header">
        <div class="header-left">
          <button class="icon-btn" id="btn-back" title="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <input 
            type="text" 
            id="input-flow-name" 
            class="flow-name-input serif-title" 
            placeholder="Nombre del flujo"
            value="${this.flowName}" 
          />
        </div>
        <div class="header-right">
          <span class="total-time-badge">${totalMinutes}m total</span>
          <button class="btn-save" id="btn-save-flow">
            ✓ Guardar
          </button>
        </div>
      </header>

      <!-- Cuerpo del Editor: Panel Lateral + Secuencia de Bloques -->
      <div class="editor-body">
        <!-- Panel de Selección de Tipo de Bloque -->
        <aside class="block-selector-sidebar">
          <span class="sidebar-title">TIPO DE BLOQUE</span>
          
          <div class="block-preset-card" data-add-type="ENFOQUE">
            <div class="preset-header">
              <span class="icon gold">⚡</span>
              <div>
                <h4>Enfoque</h4>
                <span class="subtext">25m por defecto</span>
              </div>
            </div>
          </div>

          <div class="block-preset-card" data-add-type="DESCANSO">
            <div class="preset-header">
              <span class="icon blue">☕</span>
              <div>
                <h4>Descanso</h4>
                <span class="subtext">5m por defecto</span>
              </div>
            </div>
          </div>

          <div class="block-preset-card" data-add-type="MOVIMIENTO">
            <div class="preset-header">
              <span class="icon green">📈</span>
              <div>
                <h4>Movimiento</h4>
                <span class="subtext">10m por defecto</span>
              </div>
            </div>
          </div>

          <div class="block-preset-card" data-add-type="PROCRASTINAR">
            <div class="preset-header">
              <span class="icon rose">🎮</span>
              <div>
                <h4>Procrastinar</h4>
                <span class="subtext">15m por defecto</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Lista Interactiva de Bloques Agregados -->
        <main class="blocks-timeline">
          <div class="blocks-list">
            ${this.currentBlocks.map((block, idx) => this.renderBlockItem(block, idx + 1)).join('')}
          </div>

          <!-- Barra de progreso visual por colores (Timeline preview) -->
          <div class="timeline-bar-preview">
            ${this.currentBlocks.map(b => `
              <div 
                class="segment ${b.type.toLowerCase()}" 
                style="flex: ${b.durationMinutes};"
                title="${b.type}: ${b.durationMinutes}m"
              ></div>
            `).join('')}
          </div>
        </main>
      </div>
    `;

    this.bindEvents(view, router, editingId);
  }

  private static renderBlockItem(block: Block, index: number): string {
    const typeNames: Record<BlockType, string> = {
      ENFOQUE: 'Enfoque',
      DESCANSO: 'Descanso',
      MOVIMIENTO: 'Movimiento',
      PROCRASTINAR: 'Procrastinar'
    };

    const typeIcons: Record<BlockType, string> = {
      ENFOQUE: '⚡',
      DESCANSO: '☕',
      MOVIMIENTO: '📈',
      PROCRASTINAR: '🎮'
    };

    return `
      <div class="block-item-card ${block.type.toLowerCase()}" data-block-id="${block.id}">
        <div class="block-left">
          <span class="block-number">${index}</span>
          <span class="block-icon">${typeIcons[block.type]}</span>
          <span class="block-label">${typeNames[block.type]}</span>
        </div>
        <div class="block-controls">
          <button class="step-btn" data-action="decrement" data-id="${block.id}">-</button>
          <span class="duration-display">${block.durationMinutes}m</span>
          <button class="step-btn" data-action="increment" data-id="${block.id}">+</button>
          <button class="icon-btn delete-btn" data-action="delete" data-id="${block.id}" title="Eliminar">🗑️</button>
        </div>
      </div>
    `;
  }

  private static bindEvents(view: HTMLElement, router: AppRouter, editingId?: string) {
    const nameInput = view.querySelector('#input-flow-name') as HTMLInputElement;

    nameInput.addEventListener('input', () => {
      this.flowName = nameInput.value;
    });

    // Volver atrás
    view.querySelector('#btn-back')?.addEventListener('click', () => {
      router.navigate('home');
    });

    // Añadir nuevo bloque desde la barra lateral
    view.querySelectorAll('[data-add-type]').forEach(card => {
      card.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-add-type') as BlockType;
        const defaultDurations: Record<BlockType, number> = {
          ENFOQUE: 25,
          DESCANSO: 5,
          MOVIMIENTO: 10,
          PROCRASTINAR: 15
        };

        this.currentBlocks.push({
          id: crypto.randomUUID(),
          type,
          durationMinutes: defaultDurations[type],
          position: this.currentBlocks.length + 1
        });

        this.updateView(view, router, editingId);
      });
    });

    // Incrementar, Decrementar o Eliminar Bloque
    view.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).getAttribute('data-action');
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        const targetBlock = this.currentBlocks.find(b => b.id === id);

        if (!targetBlock) return;

        if (action === 'increment') {
          targetBlock.durationMinutes += 1;
        } else if (action === 'decrement' && targetBlock.durationMinutes > 1) {
          targetBlock.durationMinutes -= 1;
        } else if (action === 'delete') {
          this.currentBlocks = this.currentBlocks.filter(b => b.id !== id);
        }

        this.updateView(view, router, editingId);
      });
    });

    // Guardar Flujo
    view.querySelector('#btn-save-flow')?.addEventListener('click', () => {
      const finalName = this.flowName.trim() || 'Flujo sin nombre';

      if (this.currentBlocks.length === 0) {
        alert('Añade al menos un bloque al flujo.');
        return;
      }

      const flowToSave: Flow = {
        id: editingId || crypto.randomUUID(),
        name: finalName,
        blocks: this.currentBlocks.map((b, idx) => ({ ...b, position: idx + 1 })),
        createdAt: new Date().toISOString()
      };

      StorageService.saveFlow(flowToSave);
      router.navigate('home');
    });
  }
}