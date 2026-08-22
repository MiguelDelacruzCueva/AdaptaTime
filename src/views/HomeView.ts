// En src/views/HomeView.ts
import { AppRouter } from '../app';
import { StorageService, TaskItem } from '../services/storage.service';
import { Flow, BlockType } from '../models/flow.model';
import { BLOCK_ICONS_SVG, UI_ICONS } from '../utils/icons';
import { ModalService } from '../services/modal.service';
import { formatMinutesReadable } from '../utils/format';
import { FlowRunnerService } from '../services/flow-runner.service';

export class HomeView {
  private static isEditingName: boolean = false;

  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'dashboard-container';

    const user = StorageService.getUser();
    const flows = StorageService.getFlows().sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    const tasks = StorageService.getTasks();


    const history = StorageService.getHistory();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMinutes = history
      .filter(h => h.completedAt.startsWith(todayStr))
      .reduce((acc, h) => acc + h.totalDurationMinutes, 0);

    const goalMinutes = StorageService.getDailyGoal();
    const goalPercent = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100));

    view.innerHTML = `
      <div class="dashboard-grid">
        <!-- COLUMNA IZQUIERDA -->
        <div class="main-column" style="display: flex; flex-direction: column; gap: 1.5rem; min-width: 0;">

          <!-- MÓDULO MIS FLUJOS -->
          <div class="dashboard-card" style="min-width: 0;">
            <div class="card-header-row">
              <h3 class="card-header-title">
                <span style="color: var(--color-enfoque, #e5c158); display: inline-flex;">${BLOCK_ICONS_SVG.ENFOQUE}</span> MIS FLUJOS
              </h3>
              
            </div>

            <div class="search-row-container" style="display: flex; gap: 0.6rem; align-items: center; margin-bottom: 1rem;">
              <div class="search-bar-wrapper" style="flex: 1; margin-bottom: 0;">
                <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" id="input-search-flows" class="search-input" placeholder="Buscar flujo por nombre..." autocomplete="off" />
              </div>

              <button class="btn-gold-pill btn-add-flow-circle" id="btn-create-flow" title="Nuevo flujo">+</button>
            </div>

            <div class="flows-grid" id="flows-grid-container" style="max-height: 380px; overflow-y: auto;">
              ${flows.length === 0 ? `
                <div class="empty-hero-card">
                  <div class="color-dots-4-row">
                    <span class="dot enfoque"></span>
                    <span class="dot descanso"></span>
                    <span class="dot movimiento"></span>
                    <span class="dot procrastinar"></span>
                  </div>
                  <h3 class="empty-hero-title">Crea tu primer flujo</h3>
                  <p class="empty-hero-desc">
                    Diseña una secuencia de bloques — enfoque, descanso, movimiento — y ponla en marcha cuando quieras.
                  </p>
                  <button class="btn-gold-pill" id="btn-empty-create-flow" style="padding: 0.6rem 1.4rem;">
                    + Nuevo flujo
                  </button>
                </div>
              ` : flows.map(f => this.renderFlowCard(f)).join('')}
            </div>
          </div>

          <!-- MÓDULO DE TAREAS -->
          <div class="dashboard-card" style="min-width: 0;">
            <div class="card-header-row">
              <h3 class="card-header-title">
                <span style="display: inline-flex;">${UI_ICONS.check}</span> TAREAS DE LA SESIÓN
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

        <!-- COLUMNA DERECHA -->
        <div class="side-column" style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="dashboard-card">
            <div class="card-header-row">
              <h3 class="card-header-title">Progreso diario</h3>
              <button class="icon-btn" id="btn-edit-daily-goal" title="Modificar objetivo diario" style="opacity: 0.7;">
                ${UI_ICONS.edit}
              </button>
            </div>

            <div class="progress-ring-stage" style="position: relative; justify-content: center;">
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
               <span class="ring-goal-value">${formatMinutesReadable(todayMinutes)}</span>
               <span class="ring-goal-unit">de ${formatMinutesReadable(goalMinutes)}</span>
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

    let previewBlocks = flow.blocks;
    if (flow.blocks.length > 10) {
      previewBlocks = Array.from({ length: 10 }, (_, i) => {
        const sampleIdx = Math.floor((i * flow.blocks.length) / 10);
        return flow.blocks[sampleIdx];
      });
    }


    const breakdownHTML = (Object.keys(totals) as BlockType[])
      .filter(type => totals[type] > 0)
      .map(type => `
        <span class="meta-item ${type.toLowerCase()}">
          ${BLOCK_ICONS_SVG[type]}
          <span>${totals[type]}m</span>
        </span>
      `).join('');

    return `
      <div class="flow-card" data-id="${flow.id}">
        <div class="flow-info">
          <div class="flow-icon-bars" title="${flow.blocks.length} bloques en total">
            ${previewBlocks.map(b => `<span class="bar ${b.type.toLowerCase()}"></span>`).join('')}
          </div>

          <div class="flow-details">
            <h4 class="flow-title" title="${flow.name}">${flow.name}</h4>
            <div class="flow-meta-row">
              ${breakdownHTML}
            </div>
          </div>
        </div>

        <div class="flow-actions-right">
          <span class="total-duration">${formatMinutesReadable(totalMinutes)}</span>

          <button class="icon-btn edit-flow-btn desktop-only" data-edit-id="${flow.id}" title="Editar">${UI_ICONS.edit}</button>
          <button class="icon-btn delete-flow-btn desktop-only" data-delete-id="${flow.id}" title="Eliminar">${UI_ICONS.trash}</button>

          <button class="play-btn" data-play-id="${flow.id}" title="Iniciar">${UI_ICONS.play}</button>

          <div class="flow-menu-wrapper mobile-only">
            <button class="icon-btn btn-flow-menu" data-menu-id="${flow.id}" title="Opciones">${UI_ICONS.menuDots}</button>
            <div class="flow-menu-popover" id="popover-${flow.id}">
              <button class="popover-item edit-flow-btn" data-edit-id="${flow.id}">
                ${UI_ICONS.edit} Editar
              </button>
              <button class="popover-item delete-flow-btn" data-delete-id="${flow.id}">
                ${UI_ICONS.trash} Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private static renderTaskItem(task: TaskItem): string {
    return `
      <div class="task-item-row ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-content-wrapper">
          <div class="task-check-circle" data-check-id="${task.id}">
            ${task.completed ? UI_ICONS.check : ''}
          </div>
          <span class="task-title-text" title="${task.title}">${task.title}</span>
        </div>
        <button class="icon-btn btn-delete-task" data-del-task="${task.id}" style="opacity:0.6;">${UI_ICONS.close}</button>
      </div>
    `;
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    const isBusy = FlowRunnerService.isBusy();
    view.querySelector('#btn-edit-name')?.addEventListener('click', () => {
      this.isEditingName = true;
      router.navigate('home');
    });

    view.querySelector('#btn-cancel-name')?.addEventListener('click', () => {
      this.isEditingName = false;
      router.navigate('home');
    });

    view.querySelector('#btn-save-name')?.addEventListener('click', () => {
      const input = view.querySelector('#input-edit-username') as HTMLInputElement;
      const newName = input ? input.value.trim().slice(0, 20) : '';
      if (newName) {
        StorageService.saveUser(newName);
      }
      this.isEditingName = false;
      router.navigate('home');
    });

    view.querySelector('#btn-back-onboarding')?.addEventListener('click', () => {
      this.isEditingName = false;
      router.navigate('onboarding');
    });

    view.querySelector('#btn-empty-create-flow')?.addEventListener('click', () => {
      router.navigate('flow-editor');
    });

    // Editar Objetivo Diario con Modal Custom
    view.querySelector('#btn-edit-daily-goal')?.addEventListener('click', async (e) => {
  e.stopPropagation();
  const currentGoal = StorageService.getDailyGoal();
  const input = await ModalService.prompt(
    'Objetivo diario',
    'Ingresa tu objetivo en minutos (máx 1440m / 24h):',
    currentGoal.toString(),
    UI_ICONS.target
  );

  if (input !== null && input !== '') {
    let newGoal = parseInt(input, 10);
    if (!isNaN(newGoal)) {
      newGoal = Math.max(1, Math.min(1440, newGoal)); // Tope entre 1 min y 24 horas
      StorageService.setDailyGoal(newGoal);
      router.navigate('home');
    }
  }
});

    const searchInput = view.querySelector('#input-search-flows') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value.toLowerCase().trim();
      view.querySelectorAll('.flow-card').forEach(card => {
        const title = card.querySelector('.flow-title')?.textContent?.toLowerCase() || '';
        (card as HTMLElement).style.display = title.includes(q) ? 'flex' : 'none';
      });
    });
  document.querySelector('#btn-sidebar-edit-name')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const currentUser = StorageService.getUser();
      const currentName = currentUser ? currentUser.name : '';
      
      const newName = await ModalService.prompt(
        'Editar perfil',
        'Ingresa tu nuevo nombre de usuario:',
        currentName,
        UI_ICONS.edit
      );

      if (newName !== null && newName.trim() !== '') {
        StorageService.saveUser(newName.trim().slice(0, 20));
        router.navigate('home');
      }
    });

    view.querySelector('#btn-start-live')?.addEventListener('click', () => router.navigate('live-timer'));
    view.querySelector('#btn-create-flow')?.addEventListener('click', () => router.navigate('flow-editor'));

    view.querySelectorAll('[data-menu-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-menu-id');
        const targetPopover = view.querySelector(`#popover-${id}`);
        
        view.querySelectorAll('.flow-menu-popover').forEach(pop => {
          if (pop !== targetPopover) pop.classList.remove('active');
        });

        targetPopover?.classList.toggle('active');
      });
    });

    document.addEventListener('click', () => {
      view.querySelectorAll('.flow-menu-popover').forEach(pop => pop.classList.remove('active'));
    });
    const shakeCorner = () => {
      const corner = document.querySelector('#corner-running-widget');
      if (corner) {
        corner.classList.remove('corner-shake');
        void (corner as HTMLElement).offsetWidth; // Forzar reflow para reiniciar la animación
        corner.classList.add('corner-shake');
      }
    };

    
    const btnLive = view.querySelector('#btn-start-live') as HTMLButtonElement;
    if (btnLive) {
      if (isBusy) {
        btnLive.style.opacity = '0.35';
        btnLive.style.cursor = 'not-allowed';
      }
      btnLive.addEventListener('click', async () => {
        if (FlowRunnerService.isBusy()) {
          await ModalService.alert('Sesión en marcha', 'Ya tienes un flujo ejecutándose.', UI_ICONS.alert);
          return;
        }
        router.navigate('live-timer');
      });
    }

    // Iniciar flujo directamente al hacer clic en Play
    // En src/views/HomeView.ts (dentro de bindEvents)

    view.querySelectorAll('[data-play-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-play-id');
        if (!id) return;

        // 1. SI YA HAY UN FLUJO EN EJECUCIÓN
        if (FlowRunnerService.isBusy()) {
          const status = FlowRunnerService.getStatus();

          // CASO A: Presiona un flujo DIFERENTE -> No hace nada y hace vibrar el widget de esquina
          if (status && status.flow.id !== id) {
            const corner = document.querySelector('#corner-running-widget');
            if (corner) {
              corner.classList.remove('corner-shake');
              void (corner as HTMLElement).offsetWidth; // Reflow para reiniciar la animación
              corner.classList.add('corner-shake');
            }
            return;
          }

          // CASO B: Presiona el MISMO flujo -> Abre la mini-ventana sin reiniciarlo
          router.navigate('active-timer');
          return;
        }

        // 2. SI NO HAY NINGÚN FLUJO CORRIENDO -> Lo arranca de inmediato y navega
        const flow = StorageService.getFlows().find(f => f.id === id);
        if (flow) {
          FlowRunnerService.startFlow(flow);
          router.navigate('active-timer');
        }
      });
    });
//'.edit-flow-btn'
    view.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-edit-id');
        if (!id) return;

        // BLOQUEO: Si el flujo a editar está en uso, no entra al editor y sacude el widget
        if (FlowRunnerService.isBusy()) {
          const status = FlowRunnerService.getStatus();
          if (status && status.flow.id === id) {
            shakeCorner();
            return;
          }
        }

        router.navigate('flow-editor', { flowId: id });
      });
    });
//'.delete-flow-btn'
    view.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-delete-id');
        if (!id) return;

        // BLOQUEO: Si el flujo a eliminar está en uso, ignora la eliminación
        if (FlowRunnerService.isBusy()) {
          const status = FlowRunnerService.getStatus();
          if (status && status.flow.id === id) {
            shakeCorner();
            return;
          }
        }

        const ok = await ModalService.confirm(
          '¿Eliminar flujo?',
          'Esta acción no se puede deshacer.',
          UI_ICONS.trash
        );

        if (ok) {
          StorageService.deleteFlow(id);
          router.navigate('home');
        }
      });
    });

    this.bindTaskEvents(view);
  }

  private static refreshTasksUI(view: HTMLElement) {
    const tasksContainer = view.querySelector('#tasks-list-container');
    if (tasksContainer) {
      const tasks = StorageService.getTasks();
      tasksContainer.innerHTML = tasks.map(t => this.renderTaskItem(t)).join('');
      this.bindTaskEvents(view);
    }
  }

  private static bindTaskEvents(view: HTMLElement) {
    const input = view.querySelector('#input-new-task') as HTMLInputElement;

    const addTask = () => {
      if (!input) return;
      const val = input.value.trim();
      if (val) {
        StorageService.addTask(val);
        input.value = '';
        this.refreshTasksUI(view);
      }
    };

    const addBtn = view.querySelector('#btn-add-task');
    if (addBtn) {
      const newAddBtn = addBtn.cloneNode(true);
      addBtn.parentNode?.replaceChild(newAddBtn, addBtn);
      newAddBtn.addEventListener('click', addTask);
    }

    if (input) {
      input.onkeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') addTask();
      };
    }

    view.querySelectorAll('[data-check-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-check-id');
        if (id) {
          StorageService.toggleTask(id);
          this.refreshTasksUI(view);
        }
      });
    });

    view.querySelectorAll('[data-del-task]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-del-task');
        if (id) {
          StorageService.deleteTask(id);
          this.refreshTasksUI(view);
        }
      });
    });
  }

  private static getGreetingByTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'BUENOS DÍAS';
    if (hour < 19) return 'BUENAS TARDES';
    return 'BUENAS NOCHES';
  }
}