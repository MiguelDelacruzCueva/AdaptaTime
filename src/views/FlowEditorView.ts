// src/views/FlowEditorView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { Block, BlockType, Flow } from '../models/flow.model';
import { BLOCK_ICONS_SVG } from '../utils/icons';
import { ModalService } from '../services/modal.service';

export class FlowEditorView {
  private static flowName: string = '';
  private static blocks: Block[] = [];
  private static editingFlowId: string | null = null;

  static render(router: AppRouter, params: Record<string, unknown> = {}): HTMLElement {
    const view = document.createElement('div');
    view.className = 'editor-container';

    this.editingFlowId = (params.flowId as string) || null;
    if (this.editingFlowId) {
      const flow = StorageService.getFlows().find(f => f.id === this.editingFlowId);
      if (flow) {
        this.flowName = flow.name;
        this.blocks = JSON.parse(JSON.stringify(flow.blocks));
      }
    } else {
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

    view.innerHTML = `
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
        <aside class="block-selector-sidebar">
          <span class="sidebar-subtitle">TIPO DE BLOQUE</span>

          <div class="block-preset-card" data-type="ENFOQUE">
            ${BLOCK_ICONS_SVG.ENFOQUE}
            <div class="preset-info">
              <h4 class="preset-title">Enfoque</h4>
              <span class="preset-desc">25m por defecto</span>
            </div>
          </div>

          <div class="block-preset-card" data-type="DESCANSO">
            ${BLOCK_ICONS_SVG.DESCANSO}
            <div class="preset-info">
              <h4 class="preset-title">Descanso</h4>
              <span class="preset-desc">5m por defecto</span>
            </div>
          </div>

          <div class="block-preset-card" data-type="MOVIMIENTO">
            ${BLOCK_ICONS_SVG.MOVIMIENTO}
            <div class="preset-info">
              <h4 class="preset-title">Movimiento</h4>
              <span class="preset-desc">10m por defecto</span>
            </div>
          </div>

          <div class="block-preset-card" data-type="PROCRASTINAR">
            ${BLOCK_ICONS_SVG.PROCRASTINAR}
            <div class="preset-info">
              <h4 class="preset-title">Procrastinar</h4>
              <span class="preset-desc">15m por defecto</span>
            </div>
          </div>
        </aside>

        <section class="sequence-editor-area">
          <div class="blocks-sequence-list">
            ${this.blocks.map((b, idx) => `
              <div class="block-item-card ${b.type.toLowerCase()}" data-block-id="${b.id}">
                <div class="block-left-info">
                  <div style="display:flex; flex-direction:column; gap:2px;">
                    <button class="icon-btn btn-move-up" data-idx="${idx}" ${idx === 0 ? 'disabled style="opacity:0.2;"' : ''}>▲</button>
                    <button class="icon-btn btn-move-down" data-idx="${idx}" ${idx === this.blocks.length - 1 ? 'disabled style="opacity:0.2;"' : ''}>▼</button>
                  </div>
                  <span class="block-index-number">${idx + 1}</span>
                  <span class="block-name-type">${BLOCK_ICONS_SVG[b.type]} ${b.type.charAt(0) + b.type.slice(1).toLowerCase()}</span>
                </div>

                <div class="block-controls-right">
                  <div class="duration-adjuster">
                    <button class="btn-adjust btn-minus" data-id="${b.id}">-</button>
                    <span class="duration-value-text" data-id="${b.id}" title="Doble clic para editar minutos">${b.durationMinutes}m</span>
                    <button class="btn-adjust btn-plus" data-id="${b.id}">+</button>
                  </div>
                  <button class="btn-delete-block" data-id="${b.id}" title="Eliminar bloque">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>

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
    view.querySelector('#btn-save-flow')?.addEventListener('click', async () => {
      if (!this.flowName.trim()) {
         await ModalService.alert('Nombre requerido', 'Por favor asígnale un nombre a tu flujo antes de guardar.', '⚠️');
        return;
      }
      if (this.blocks.length === 0) {
        await ModalService.alert('Sin bloques', 'Agrega al menos un bloque a la secuencia.', '⚠️');
        return;
      }

      this.syncPositions();

      const flowData: Flow = {
        id: this.editingFlowId || FlowEditorView.generateId(),
        name: this.flowName.trim(),
        blocks: this.blocks,
        createdAt: new Date().toISOString()
      };

      StorageService.saveFlow(flowData);
      router.navigate('home');
    });

    // Agregar Bloques desde Sidebar
    view.querySelectorAll('.block-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-type') as BlockType;
        const defaultMin: Record<BlockType, number> = { ENFOQUE: 25, DESCANSO: 5, MOVIMIENTO: 10, PROCRASTINAR: 15 };
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

    // Botones + / -
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

    // Editar minutos con doble clic
    view.querySelectorAll('.duration-value-text').forEach(span => {
      span.addEventListener('dblclick', (e) => {
        const target = e.currentTarget as HTMLElement;
        const id = target.getAttribute('data-id');
        const block = this.blocks.find(b => b.id === id);
        if (!block) return;

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '1';
        input.max = '999';
        input.value = block.durationMinutes.toString();
        input.className = 'duration-input-inline';

        target.replaceWith(input);
        input.focus();
        input.select();

        const saveValue = () => {
          const val = parseInt(input.value);
          if (!isNaN(val) && val > 0) {
            block.durationMinutes = val;
          }
          this.renderContent(view, router);
        };

        input.addEventListener('blur', saveValue);
        input.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter') saveValue();
        });
      });
    });

    // Reordenar Bloques
    view.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-idx') || '0');
        if (idx > 0) {
          const temp = this.blocks[idx];
          this.blocks[idx] = this.blocks[idx - 1];
          this.blocks[idx - 1] = temp;
          this.syncPositions();
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
          this.syncPositions();
          this.renderContent(view, router);
        }
      });
    });

    // Eliminar Bloque
    view.querySelectorAll('.btn-delete-block').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        this.blocks = this.blocks.filter(b => b.id !== id);
        this.syncPositions();
        this.renderContent(view, router);
      });
    });
  }

  private static syncPositions() {
    this.blocks.forEach((b, idx) => {
      b.position = idx;
    });
  }

  private static generateId(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}