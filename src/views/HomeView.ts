// src/views/HomeView.ts (Reemplazar la clase completa)
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { Flow, BlockType } from '../models/flow.model';

export class HomeView {
  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'home-container';

    const user = StorageService.getUser();
    const flows = StorageService.getFlows();
    const userName = user ? user.name : 'Usuario';

    const hour = new Date().getHours();
    let greeting = 'BUENAS NOCHES';
    if (hour >= 6 && hour < 12) greeting = 'BUENOS DÍAS';
    else if (hour >= 12 && hour < 19) greeting = 'BUENAS TARDES';

    view.innerHTML = `
      <header class="top-bar">
        <div class="user-greeting">
          <span class="greeting-subtitle">${greeting}</span>
          <div class="name-edit-wrapper" id="name-display-container">
            <h2 class="serif-title user-name" id="user-name-text">${userName}</h2>
            <button class="icon-btn edit-btn" id="btn-edit-name" title="Editar nombre">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </button>
          </div>

          <div class="name-edit-form hidden" id="name-edit-container">
            <input type="text" id="input-edit-name" value="${userName}" class="serif-input" />
            <button class="icon-btn check-btn" id="btn-save-name">✓</button>
            <button class="icon-btn cancel-btn" id="btn-cancel-name">✕</button>
            <div class="reset-link-wrapper">
              <button class="link-btn" id="btn-reset-welcome">← Volver a la bienvenida</button>
            </div>
          </div>
        </div>

        <div class="top-nav-actions">
          <button class="icon-btn nav-icon" id="btn-nav-history" title="Historial">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </button>
          <button class="icon-btn nav-icon" id="btn-nav-calendar" title="Calendario">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="main-content">
        ${flows.length === 0 ? this.renderEmptyState() : this.renderFlowsList(flows)}
      </main>
    `;

    this.bindEvents(view, router);
    return view;
  }

  private static renderEmptyState(): string {
    return `
      <div class="empty-state">
        <div class="indicator-dots">
          <span class="dot gold"></span>
          <span class="dot blue"></span>
          <span class="dot green"></span>
          <span class="dot rose"></span>
        </div>
        <h3 class="serif-title empty-title">Crea tu primer flujo</h3>
        <p class="empty-description">
          Diseña una secuencia de bloques — enfoque,<br>
          descanso, movimiento — y ponla en marcha<br>
          cuando quieras.
        </p>
        <button class="btn-gold-pill" id="btn-create-flow">
          + Nuevo flujo
        </button>
      </div>
    `;
  }

  private static renderFlowsList(flows: Flow[]): string {
    return `
      <div class="flows-list-container">
        <div class="section-header">
          <span class="section-title">MIS FLUJOS</span>
          <button class="btn-text-gold" id="btn-create-flow">+ Nuevo</button>
        </div>
        <div class="flows-grid">
          ${flows.map(f => this.renderFlowCard(f)).join('')}
        </div>
      </div>
    `;
  }

  private static renderFlowCard(flow: Flow): string {
    // 1. Calcular totales por categoría
    const totals: Record<BlockType, number> = {
      ENFOQUE: 0,
      DESCANSO: 0,
      MOVIMIENTO: 0,
      PROCRASTINAR: 0
    };

    let totalMinutes = 0;
    flow.blocks.forEach(b => {
      totals[b.type] += b.durationMinutes;
      totalMinutes += b.durationMinutes;
    });

    // 2. Construir la tira de micro-iconos (ej: ⚡ 10m  ☕ 5m)
    const iconsMap: Record<BlockType, string> = {
      ENFOQUE: '⚡',
      DESCANSO: '☕',
      MOVIMIENTO: '📈',
      PROCRASTINAR: '🎮'
    };

    const breakdownHTML = (Object.keys(totals) as BlockType[])
      .filter(type => totals[type] > 0)
      .map(type => `
        <span class="meta-item">
          <span class="meta-icon">${iconsMap[type]}</span>
          <span>${totals[type]}m</span>
        </span>
      `).join('');

    // 3. Tiempo relativo ("Creado hace 0m")
    const createdText = this.formatCreatedTime(flow.createdAt);

    return `
      <div class="flow-card" data-id="${flow.id}">
        <div class="flow-info">
          <!-- Barritas verticales a la izquierda -->
          <div class="flow-icon-bars">
            ${flow.blocks.map(b => `<span class="bar ${b.type.toLowerCase()}"></span>`).join('')}
          </div>

          <div class="flow-details">
            <h4 class="flow-title">${flow.name}</h4>
            <div class="flow-meta-row">
              ${breakdownHTML}
              <span class="created-at">${createdText}</span>
            </div>
          </div>
        </div>

        <div class="flow-actions-right">
          <span class="total-duration">${totalMinutes}m</span>
          <button class="icon-btn delete-flow-btn" data-delete-id="${flow.id}" title="Eliminar flujo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button class="play-btn" data-play-id="${flow.id}">▶</button>
        </div>
      </div>
    `;
  }

  private static formatCreatedTime(isoString?: string): string {
    if (!isoString) return 'Creado recientemente';
    const date = new Date(isoString);
    const diffMin = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60));
    if (diffMin < 1) return 'Creado hace 0m';
    if (diffMin < 60) return `Creado hace ${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    return `Creado hace ${diffHours}h`;
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    const displayContainer = view.querySelector('#name-display-container')!;
    const editContainer = view.querySelector('#name-edit-container')!;
    const btnEdit = view.querySelector('#btn-edit-name')!;
    const btnSave = view.querySelector('#btn-save-name')!;
    const btnCancel = view.querySelector('#btn-cancel-name')!;
    const btnReset = view.querySelector('#btn-reset-welcome')!;
    const inputName = view.querySelector('#input-edit-name') as HTMLInputElement;
    const nameText = view.querySelector('#user-name-text')!;

    btnEdit.addEventListener('click', () => {
      displayContainer.classList.add('hidden');
      editContainer.classList.remove('hidden');
      inputName.focus();
    });

    const closeEdit = () => {
      editContainer.classList.add('hidden');
      displayContainer.classList.remove('hidden');
    };

    btnSave.addEventListener('click', () => {
      const newName = inputName.value.trim();
      if (newName) {
        StorageService.saveUser(newName);
        nameText.textContent = newName;
      }
      closeEdit();
    });

    btnCancel.addEventListener('click', closeEdit);

    btnReset.addEventListener('click', () => {
      StorageService.saveUser('');
      router.navigate('onboarding');
    });

    // Navegación
    view.querySelector('#btn-nav-history')?.addEventListener('click', () => router.navigate('history'));
    view.querySelector('#btn-nav-calendar')?.addEventListener('click', () => router.navigate('calendar'));
    view.querySelector('#btn-create-flow')?.addEventListener('click', () => router.navigate('flow-editor'));

    // Botón Play
    view.querySelectorAll('[data-play-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-play-id');
        router.navigate('active-timer', { flowId: id });
      });
    });

    // Botón Eliminar Flujo
    view.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (e.currentTarget as HTMLElement).getAttribute('data-delete-id');
        if (id && confirm('¿Deseas eliminar este flujo?')) {
          const flows = StorageService.getFlows().filter(f => f.id !== id);
          localStorage.setItem('focus_flow_flows', JSON.stringify(flows));
          router.navigate('home');
        }
      });
    });
  }
}