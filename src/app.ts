// src/app.ts
import { HomeView } from './views/HomeView';
import { FlowEditorView } from './views/FlowEditorView';
import { ActiveTimerView } from './views/ActiveTimerView';
import { LiveTimerView } from './views/LiveTimerView';
import { CalendarView } from './views/CalendarView';
import { OnboardingView } from './views/OnboardingView';
import { StorageService } from './services/storage.service';
import { ModalService } from './services/modal.service';
import { TauriService } from './services/tauri.service';
import { UI_ICONS } from './utils/icons';

export type Route = 'home' | 'flow-editor' | 'active-timer' | 'live-timer' | 'calendar' | 'onboarding';

export class AppRouter {
  private appElement: HTMLElement;
  private currentRoute: Route = 'home';
  private currentParams: Record<string, unknown> = {};

  constructor(appElement: HTMLElement) {
    this.appElement = appElement;
  }

  init(): void {
    const user = StorageService.getUser();
    if (!user) {
      this.navigate('onboarding');
    } else {
      this.navigate('home');
    }
  }

  navigate(route: Route, params: Record<string, unknown> = {}): void {
    this.currentRoute = route;
    this.currentParams = params;
    this.renderLayout(params);
  }

  refreshCurrentRoute(): void {
    this.navigate(this.currentRoute, this.currentParams);
  }

  private renderLayout(params: Record<string, unknown> = {}): void {
    this.appElement.innerHTML = '';

    const user = StorageService.getUser();
    if (!user && this.currentRoute !== 'onboarding') {
      this.currentRoute = 'onboarding';
    }

    if (this.currentRoute === 'active-timer') {
      const viewContent = this.getViewElement(this.currentRoute, params);
      this.appElement.appendChild(viewContent);
      return;
    }

    const userName = user ? user.name : 'Usuario';
    const greeting = this.getGreetingByTime();

    const layout = document.createElement('div');
    layout.className = 'app-root-shell';

    layout.innerHTML = `
      <!-- BARRA DE TÍTULO NATIVA ULTRA-DELGADA -->
      <header class="system-titlebar" data-tauri-drag-region="true">
        <div class="titlebar-left" data-tauri-drag-region="true">
          <!-- Botón de menú: visible solo en pantalla reducida -->
          <button class="titlebar-burger-btn" id="btn-toggle-sidebar" title="Menú lateral">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <!-- Icono y Nombre -->
          <div class="titlebar-app-identity" data-tauri-drag-region="true">
            <svg class="titlebar-logo-svg" width="16" height="16" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="#141418" stroke="#1c1c22" stroke-width="4"/>
              <path d="M 80 15 A 65 65 0 0 1 133.24 117.28 L 108.67 100.08 A 35 35 0 0 0 80 45 Z" fill="#9b7e47"/>
              <path d="M 133.24 117.28 A 65 65 0 0 1 42.72 133.24 L 59.92 108.67 A 35 35 0 0 0 108.67 100.08 Z" fill="#406371"/>
              <path d="M 42.72 133.24 A 65 65 0 0 1 17.21 63.18 L 46.19 70.94 A 35 35 0 0 0 59.92 108.67 Z" fill="#4a7051"/>
              <path d="M 17.21 63.18 A 65 65 0 0 1 80 15 L 80 45 A 35 35 0 0 0 46.19 70.94 Z" fill="#7d4b4e"/>
              <circle cx="80" cy="80" r="35" fill="#0f0f13"/>
              <path d="M 77.5 80 L 79.2 24 A 1 1 0 0 1 81.5 24 L 82.5 80 Z" fill="#bfa05d"/>
              <circle cx="80" cy="80" r="6" fill="#bfa05d"/>
            </svg>
            <span class="titlebar-title-text" data-tauri-drag-region="true">Focus Flow</span>
          </div>
        </div>

        <!-- Área de arrastre central libre -->
        <div class="titlebar-drag-spacer" data-tauri-drag-region="true"></div>

        <!-- Botones nativos de ventana -->
        <div class="system-window-buttons">
          <button class="sys-btn" id="sys-win-min" title="Minimizar">
            <svg width="10" height="1" viewBox="0 0 10 1"><line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" stroke-width="1"/></svg>
          </button>
          <button class="sys-btn" id="sys-win-max" title="Maximizar">
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" stroke-width="1"/></svg>
          </button>
          <button class="sys-btn sys-close" id="sys-win-close" title="Cerrar">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.1"/>
              <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.1"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- CUERPO PRINCIPAL -->
      <div class="app-layout">
        <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
        
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-top-group">
            <nav class="sidebar-menu">
              <button class="nav-item ${this.currentRoute === 'home' ? 'active' : ''}" data-route="home">
                <span>-</span> Inicio
              </button>
              <button class="nav-item ${this.currentRoute === 'flow-editor' ? 'active' : ''}" data-route="flow-editor">
                <span>-</span> Nuevo flujo
              </button>
              <button class="nav-item ${this.currentRoute === 'live-timer' ? 'active' : ''}" data-route="live-timer">
                <span>-</span> Cronómetro
              </button>
              <button class="nav-item ${this.currentRoute === 'calendar' ? 'active' : ''}" data-route="calendar">
                <span>-</span> Calendario
              </button>
            </nav>
          </div>

          <div class="sidebar-user-card">
            <div class="sidebar-user-info">
              <span class="sidebar-user-greeting">${greeting}</span>
              <span class="sidebar-user-name" title="${userName}">${userName}</span>
            </div>
            <button class="icon-btn btn-edit-user-sidebar" id="btn-edit-user-sidebar" title="Editar nombre">
              ${UI_ICONS.edit}
            </button>
          </div>
        </aside>

        <main class="main-viewport" id="route-container"></main>
      </div>
    `;

    const routeContainer = layout.querySelector('#route-container') as HTMLElement;
    routeContainer.appendChild(this.getViewElement(this.currentRoute, params));

    this.bindEvents(layout);
    this.appElement.appendChild(layout);
  }

  private bindEvents(layout: HTMLElement): void {
    // 1. Botones de ventana nativos
    layout.querySelector('#sys-win-min')?.addEventListener('click', () => TauriService.minimize());
    layout.querySelector('#sys-win-max')?.addEventListener('click', () => TauriService.toggleMaximize());
    layout.querySelector('#sys-win-close')?.addEventListener('click', () => TauriService.close());

    // 2. Comportamiento del Menú Lateral (Drawer responsive)
    const sidebar = layout.querySelector('#app-sidebar') as HTMLElement;
    const backdrop = layout.querySelector('#sidebar-backdrop') as HTMLElement;
    const titlebar = layout.querySelector('.system-titlebar') as HTMLElement;
    const toggleBtn = layout.querySelector('#btn-toggle-sidebar');

    titlebar?.addEventListener('mousedown', (e: MouseEvent) => {
      // Ignorar si se hace clic sobre un botón
      if ((e.target as HTMLElement).closest('button')) return;
      
      if (e.button === 0) { // Clic izquierdo
        TauriService.startDragging();
      }
    });

    // Doble clic en la barra para maximizar o restaurar (comportamiento estándar de Windows)
    titlebar?.addEventListener('dblclick', (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      TauriService.toggleMaximize();
    });

    const toggleSidebar = () => {
      const isOpen = sidebar.classList.toggle('open');
      if (isOpen) {
        backdrop.classList.add('active');
      } else {
        backdrop.classList.remove('active');
      }
    };

    toggleBtn?.addEventListener('click', toggleSidebar);
    backdrop?.addEventListener('click', toggleSidebar);

    // 3. Navegación
    layout.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = (e.currentTarget as HTMLElement).getAttribute('data-route') as Route;
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
        if (route) this.navigate(route);
      });
    });

    // 4. Edición de usuario
    layout.querySelector('#btn-edit-user-sidebar')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const currentUser = StorageService.getUser();
      const currentName = currentUser ? currentUser.name : 'Usuario';
      
      const newName = await ModalService.prompt(
        'Nombre de usuario',
        'Ingresa tu nuevo nombre o apodo (máx 20 letras):',
        currentName,
        UI_ICONS.edit,
        'text',
        20
      );

      if (newName !== null && newName.trim() !== '') {
        StorageService.saveUser(newName.trim().slice(0, 20));
        this.refreshCurrentRoute();
      }
    });
  }

  private getViewElement(route: Route, params: Record<string, unknown>): HTMLElement {
    switch (route) {
      case 'home':
        return HomeView.render(this);
      case 'flow-editor':
        return FlowEditorView.render(this, params);
      case 'active-timer':
        return ActiveTimerView.render(this, params);
      case 'live-timer':
        return LiveTimerView.render(this);
      case 'calendar':
        return CalendarView.render(this);
      case 'onboarding':
        return OnboardingView.render(this);
      default:
        return HomeView.render(this);
    }
  }

  private getGreetingByTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'BUENOS DÍAS';
    if (hour < 19) return 'BUENAS TARDES';
    return 'BUENAS NOCHES';
  }
}