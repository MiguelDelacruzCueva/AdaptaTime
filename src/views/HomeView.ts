// src/views/HomeView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';
import { Flow } from '../models/flow.model';

export class HomeView {
  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'home-container';

    const user = StorageService.getUser();
    const flows = StorageService.getFlows();
    const userName = user ? user.name : 'Usuario';

    // Determina el saludo según la hora local
    const hour = new Date().getHours();
    let greeting = 'BUENAS NOCHES';
    if (hour >= 6 && hour < 12) greeting = 'BUENOS DÍAS';
    else if (hour >= 12 && hour < 19) greeting = 'BUENAS TARDES';

    view.innerHTML = `
      <!-- Barra superior con saludo e iconos de navegación -->
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

          <!-- Modo Edición de Nombre oculto por defecto -->
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

      <!-- Contenido Principal: Lista de Flujos o Estado Vacío -->
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
          ${flows.map(f => `
            <div class="flow-card" data-id="${f.id}">
              <div class="flow-info">
                <div class="flow-icon-bars">
                  <span class="bar gold"></span>
                  <span class="bar blue"></span>
                </div>
                <div class="flow-details">
                  <h4 class="flow-title">${f.name}</h4>
                  <span class="flow-meta">${f.blocks.length} bloques</span>
                </div>
              </div>
              <button class="play-btn" data-play-id="${f.id}">▶</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    // --- EDICIÓN DE NOMBRE ---
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

    // --- NAVEGACIÓN ---
    view.querySelector('#btn-nav-history')?.addEventListener('click', () => router.navigate('history'));
    view.querySelector('#btn-nav-calendar')?.addEventListener('click', () => router.navigate('calendar'));
    view.querySelector('#btn-create-flow')?.addEventListener('click', () => router.navigate('flow-editor'));

    // Botones de Play para lanzar un flujo activo
    view.querySelectorAll('[data-play-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-play-id');
        router.navigate('active-timer', { flowId: id });
      });
    });
  }
}