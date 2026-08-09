// src/views/HomeView.ts
import { AppRouter } from '../app';
import { StorageService, TaskItem } from '../services/storage.service';
import { Flow, BlockType } from '../models/flow.model';
import { BLOCK_ICONS_SVG } from '../utils/icons';
import { ModalService } from '../services/modal.service';

export class HomeView {
  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'dashboard-container';

    const user = StorageService.getUser();
    const flows = StorageService.getFlows().sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    const tasks = StorageService.getTasks();
    const userName = user ? user.name : 'Usuario';

    // Cálculo básico de minutos completados hoy
    const history = StorageService.getHistory();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMinutes = history
      .filter(h => h.completedAt.startsWith(todayStr))
      .reduce((acc, h) => acc + h.totalDurationMinutes, 0);

    const goalMinutes = 30; // Meta diaria configurable
    const goalPercent = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

    view.innerHTML = `
      <div class="dashboard-grid">
        <!-- COLUMNA IZQUIERDA: FLUJOS Y TAREAS -->
        <div class="main-column" style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- MÓDULO MIS FLUJOS -->
          <div class="dashboard-card">
            <div class="card-header-row">
              <h3 class="card-header-title">
                <span>|</span> MIS FLUJOS
              </h3>
              <div style="display: flex; gap: 0.6rem;">
                <button class="btn-text-gold" id="btn-start-live">Al vuelo</button>
                <button class="btn-text-gold" id="btn-create-flow">+ Nuevo</button>
              </div>
            </div>

            <!-- Buscador -->
            <div class="search-bar-wrapper" style="margin-bottom: 1rem;">
              <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="input-search-flows" class="search-input" placeholder="Buscar flujo por nombre..." autocomplete="off" />
            </div>

            <div class="flows-grid" id="flows-grid-container" style="max-height: 380px; overflow-y: auto;">
              ${flows.length === 0 ? `
                <p class="empty-description" style="text-align: center; padding: 2rem 0;">
                  No tienes flujos creados aún. haz clic en <strong>+ Nuevo</strong> para empezar.
                </p>
              ` : flows.map(f => this.renderFlowCard(f)).join('')}
            </div>
          </div>

          <!-- MÓDULO DE TAREAS -->
          <div class="dashboard-card">
            <div class="card-header-row">
              <h3 class="card-header-title">
                <span>☑</span> TAREAS DE LA SESIÓN
              </h3>
            </div>

            <div class="task-input-row">
              <input type="text" id="input-new-task" class="task-input-field" placeholder="Agregar una tarea pendiente..." autocomplete="off" />
              <button class="btn-gold-pill" id="btn-add-task" style="padding: 0.5rem 1rem;">+</button>
            </div>

            <div class="tasks-list" id="tasks-list-container">
              ${tasks.map(t => this.renderTaskItem(t)).join('')}
            </div>
          </div>

        </div>

        <!-- COLUMNA DERECHA: PROGRESO DIARIO -->
        <div class="side-column" style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <div class="dashboard-card">
            <div class="card-header-row">
              <h3 class="card-header-title">PROGRESO DIARIO</h3>
            </div>

            <div class="progress-ring-stage" style="position: relative; justify-content: center;">
              <!-- Anillo SVG de Meta -->
              <svg width="200" height="200" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22222a" stroke-width="8" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" 
                  stroke="var(--color-enfoque, #e5c158)" 
                  stroke-width="8" 
                  stroke-dasharray="251.2"
                  stroke-dashoffset="${251.2 - (251.2 * goalPercent) / 100}"
                  stroke-linecap="round"
                  transform="rotate(-90 50 50)"
                  style="transition: stroke-dashoffset 0.5s ease;"
                />
              </svg>

              <div class="ring-center-info">
                <span class="ring-goal-title">Objetivo diario</span>
                <span class="ring-goal-value">${todayMinutes}</span>
                <span class="ring-goal-unit">de ${goalMinutes} minutos</span>
              </div>
            </div>

            <div class="metrics-row-3">
              <div>
                <div class="metric-item-val">0</div>
                <div class="metric-item-lbl">Ayer (m)</div>
              </div>
              <div>
                <div class="metric-item-val">${todayMinutes}m</div>
                <div class="metric-item-lbl">Hoy</div>
              </div>
              <div>
                <div class="metric-item-val">1</div>
                <div class="metric-item-lbl">Racha (días)</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    this.bindEvents(view, router);
    return view;
  }

  private static renderFlowCard(flow: Flow): string {
    const totals: Record<BlockType, number> = {
      ENFOQUE: 0, DESCANSO: 0, MOVIMIENTO: 0, PROCRASTINAR: 0
    };
    let totalMinutes = 0;
    flow.blocks.forEach(b => {
      totals[b.type] += b.durationMinutes;
      totalMinutes += b.durationMinutes;
    });

    const breakdownHTML = (Object.keys(totals) as BlockType[])
      .filter(type => totals[type] > 0)
      .map(type => `
        <span class="meta-item" style="display:inline-flex; align-items:center; gap:3px;">
          ${BLOCK_ICONS_SVG[type]}
          <span>${totals[type]}m</span>
        </span>
      `).join('');

    return `
      <div class="flow-card" data-id="${flow.id}">
        <div class="flow-info">
          <div class="flow-icon-bars">
            ${flow.blocks.map(b => `<span class="bar ${b.type.toLowerCase()}"></span>`).join('')}
          </div>

          <div class="flow-details">
            <h4 class="flow-title">${flow.name}</h4>
            <div class="flow-meta-row">
              ${breakdownHTML}
            </div>
          </div>
        </div>

        <div class="flow-actions-right">
          <span class="total-duration">${totalMinutes}m</span>
          <button class="icon-btn edit-flow-btn" data-edit-id="${flow.id}" title="Editar">✏️</button>
          <button class="icon-btn delete-flow-btn" data-delete-id="${flow.id}" title="Eliminar">🗑️</button>
          <button class="play-btn" data-play-id="${flow.id}" title="Iniciar">▶</button>
        </div>
      </div>
    `;
  }

  private static renderTaskItem(task: TaskItem): string {
    return `
      <div class="task-item-row ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <div style="display:flex; align-items:center; gap:0.8rem;">
          <div class="task-check-circle" data-check-id="${task.id}">
            ${task.completed ? '✓' : ''}
          </div>
          <span>${task.title}</span>
        </div>
        <button class="icon-btn btn-delete-task" data-del-task="${task.id}" style="opacity:0.6;">✕</button>
      </div>
    `;
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    // Buscador
    const searchInput = view.querySelector('#input-search-flows') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value.toLowerCase().trim();
      view.querySelectorAll('.flow-card').forEach(card => {
        const title = card.querySelector('.flow-title')?.textContent?.toLowerCase() || '';
        (card as HTMLElement).style.display = title.includes(q) ? 'flex' : 'none';
      });
    });

    // Rutas de inicio
    view.querySelector('#btn-start-live')?.addEventListener('click', () => router.navigate('live-timer'));
    view.querySelector('#btn-create-flow')?.addEventListener('click', () => router.navigate('flow-editor'));

    // Botones de flujo (Play, Editar, Eliminar)
    view.querySelectorAll('[data-play-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-play-id');
        router.navigate('active-timer', { flowId: id });
      });
    });

    view.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-edit-id');
        router.navigate('flow-editor', { flowId: id });
      });
    });

    view.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-delete-id');
        if (id) {
          const confirmed = await ModalService.confirm('Eliminar flujo', '¿Deseas eliminar este flujo?', '🗑️');
          if (confirmed) {
            const flows = StorageService.getFlows().filter(f => f.id !== id);
            localStorage.setItem('focus_flow_flows', JSON.stringify(flows));
            router.navigate('home');
          }
        }
      });
    });

    // Gestión de Tareas
    const addTask = () => {
      const input = view.querySelector('#input-new-task') as HTMLInputElement;
      const val = input.value.trim();
      if (val) {
        StorageService.addTask(val);
        input.value = '';
        router.navigate('home');
      }
    };

    view.querySelector('#btn-add-task')?.addEventListener('click', addTask);
    view.querySelector('#input-new-task')?.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') addTask();
    });

    view.querySelectorAll('[data-check-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-check-id');
        if (id) {
          StorageService.toggleTask(id);
          router.navigate('home');
        }
      });
    });

    view.querySelectorAll('[data-del-task]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-del-task');
        if (id) {
          StorageService.deleteTask(id);
          router.navigate('home');
        }
      });
    });
  }
}