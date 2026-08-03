// src/views/FlowEditorView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { Block, BlockType, Flow } from '../models/flow.model';

export class FlowEditorView {
  private static flowName: string = '';
  private static blocks: Block[] = [];
  private static editingFlowId: string | null = null;

  static render(router: AppRouter, params: Record<string, unknown> = {}): HTMLElement {
    const view = document.createElement('div');
    view.className = 'editor-container';

    // Si viene flowId, estamos en MODO EDICIÓN
    this.editingFlowId = (params.flowId as string) || null;
    if (this.editingFlowId) {
      const flow = StorageService.getFlows().find(f => f.id === this.editingFlowId);
      if (flow) {
        this.flowName = flow.name;
        this.blocks = [...flow.blocks];
      }
    } else {
      // Modo Creación Limpio (incluyendo posición obligatoria)
      this.flowName = '';
      this.blocks = [
        { id: FlowEditorView.generateId(), type: 'ENFOQUE' as BlockType, durationMinutes: 25, position: 0 },
        { id: FlowEditorView.generateId(), type: 'DESCANSO' as BlockType, durationMinutes: 5, position: 1 }
      ];
    }

    this.renderContent(view, router);
    return view;
  }

  private static renderContent(view: HTMLElement, router: AppRouter) {
    const totalMinutes = this.blocks.reduce((acc, b) => acc + b.durationMinutes, 0);

    const iconsMap: Record<BlockType, string> = {
      ENFOQUE: '⚡',
      DESCANSO: '☕',
      MOVIMIENTO: '📈',
      PROCRASTINAR: '🎮'
    };

    view.innerHTML = `
      <!-- Encabezado con Input Elegante -->
      <header class="editor-header">
        <div class="header-title-input-wrapper">
          <button class="icon-btn" id="btn-back-home" title="Volver al inicio">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <input 
            type="text" 
            id="input-flow-name" 
            class="flow-title-input" 
            placeholder="Nombre del flujo" 
            value="${this.flowName}" 
            autocomplete="off"
          />
        </div>

        <div class="editor-actions-top">
          <span class="total-flow-duration">${totalMinutes}m total</span>
          <button class="btn-gold-pill" id="btn-save-flow">
            ✓ Guardar
          </button>
        </div>
      </header>

      <main class="editor-body">
        <!-- Sidebar de Presets -->
        <aside class="block-selector-sidebar">
          <span class="sidebar-subtitle">TIPO DE BLOQUE</span>

          <div class="block-preset-card" data-type="ENFOQUE">
            <h4 class="preset-title">⚡ Enfoque</h4>
            <span class="preset-desc">25m por defecto</span>
          </div>

          <div class="block-preset-card" data-type="DESCANSO">
            <h4 class="preset-title">☕ Descanso</h4>
            <span class="preset-desc">5m por defecto</span>
          </div>

          <div class="block-preset-card" data-type="MOVIMIENTO">
            <h4 class="preset-title">📈 Movimiento</h4>
            <span class="preset-desc">10m por defecto</span>
          </div>

          <div class="block-preset-card" data-type="PROCRASTINAR">
            <h4 class="preset-title">🎮 Procrastinar</h4>
            <span class="preset-desc">15m por defecto</span>
          </div>
        </aside>

        <!-- Área de Secuencia de Bloques -->
        <section class="sequence-editor-area">
          <div class="blocks-sequence-list">
            ${this.blocks.map((b, idx) => `
              <div class="block-item-card ${b.type.toLowerCase()}" data-block-id="${b.id}">
                <div class="block-left-info">
                  <!-- Botones de Reordenar (Arriba / Abajo) -->
                  <div style="display:flex; flex-direction:column; gap:2px;">
                    <button class="icon-btn btn-move-up" data-idx="${idx}" ${idx === 0 ? 'disabled style="opacity:0.2;"' : ''}>▲</button>
                    <button class="icon-btn btn-move-down" data-idx="${idx}" ${idx === this.blocks.length - 1 ? 'disabled style="opacity:0.2;"' : ''}>▼</button>
                  </div>
                  <span class="block-index-number">${idx + 1}</span>
                  <span class="block-name-type">${iconsMap[b.type]} ${b.type.charAt(0) + b.type.slice(1).toLowerCase()}</span>
                </div>

                <div class="block-controls-right">
                  <div class="duration-adjuster">
                    <button class="btn-adjust btn-minus" data-id="${b.id}">-</button>
                    <span class="duration-value-text">${b.durationMinutes}m</span>
                    <button class="btn-adjust btn-plus" data-id="${b.id}">+</button>
                  </div>
                  <button class="btn-delete-block" data-id="${b.id}" title="Eliminar bloque">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Línea visual preview -->
          <div class="timeline-bar-preview">
            ${this.blocks.map(b => `<div class="segment ${b.type.toLowerCase()}" style="flex: ${b.durationMinutes}"></div>`).join('')}
          </div>
        </section>
      </main>
    `;

    this.bindEvents(view, router);
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    const nameInput = view.querySelector('#input-flow-name') as HTMLInputElement;
    nameInput?.addEventListener('input', (e) => {
      this.flowName = (e.target as HTMLInputElement).value;
    });

    view.querySelector('#btn-back-home')?.addEventListener('click', () => router.navigate('home'));

    // Guardar Flujo
    view.querySelector('#btn-save-flow')?.addEventListener('click', () => {
      if (!this.flowName.trim()) {
        alert('Por favor ponle un nombre a tu flujo.');
        return;
      }
      if (this.blocks.length === 0) {
        alert('Agrega al menos un bloque al flujo.');
        return;
      }

      const flowData: Flow = {
        id: this.editingFlowId || crypto.randomUUID(),
        name: this.flowName.trim(),
        blocks: this.blocks,
        createdAt: new Date().toISOString()
      };

      StorageService.saveFlow(flowData);
      router.navigate('home');
    });

    // Agregar Bloques desde la Barra Lateral
    view.querySelectorAll('.block-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-type') as BlockType;
        const defaultMin: Record<BlockType, number> = { 
          ENFOQUE: 25, 
          DESCANSO: 5, 
          MOVIMIENTO: 10, 
          PROCRASTINAR: 15 
        };

        const newBlock: Block = {
          id: FlowEditorView.generateId(),
          type: type,
          durationMinutes: defaultMin[type] || 15,
          position: this.blocks.length
        };

        this.blocks.push(newBlock);
        this.renderContent(view, router);
      });
    });

    // Ajustar Duración (+ / -)
    view.querySelectorAll('.btn-minus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        const block = this.blocks.find(b => b.id === id);
        if (block && block.durationMinutes > 1) {
          block.durationMinutes--;
          this.renderContent(view, router);
        }
      });
    });

    view.querySelectorAll('.btn-plus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        const block = this.blocks.find(b => b.id === id);
        if (block) {
          block.durationMinutes++;
          this.renderContent(view, router);
        }
      });
    });

    // Reordenar Bloques (Arriba / Abajo)
    view.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0');
        if (idx > 0) {
          const temp = this.blocks[idx];
          this.blocks[idx] = this.blocks[idx - 1];
          this.blocks[idx - 1] = temp;
          this.renderContent(view, router);
        }
      });
    });

    view.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0');
        if (idx < this.blocks.length - 1) {
          const temp = this.blocks[idx];
          this.blocks[idx] = this.blocks[idx + 1];
          this.blocks[idx + 1] = temp;
          this.renderContent(view, router);
        }
      });
    });

    // Eliminar Bloque
    view.querySelectorAll('.btn-delete-block').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        this.blocks = this.blocks.filter(b => b.id !== id);
        this.renderContent(view, router);
      });
    });
    
  }
  private static generateId(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}