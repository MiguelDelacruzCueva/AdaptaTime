// src/app.ts
import { HomeView } from './views/HomeView';
import { FlowEditorView } from './views/FlowEditorView';
import { ActiveTimerView } from './views/ActiveTimerView';
import { LiveTimerView } from './views/LiveTimerView';
import { CalendarView } from './views/CalendarView';
import { OnboardingView } from './views/OnboardingView';
import { StorageService } from './services/storage.service';
import { ModalService } from './services/modal.service';
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

    // Vistas a pantalla completa sin Sidebar
    const isFullscreenView = ['active-timer', 'onboarding'].includes(this.currentRoute);

    if (isFullscreenView) {
      const viewContent = this.getViewElement(this.currentRoute, params);
      this.appElement.appendChild(viewContent);
      return;
    }

    const userName = user ? user.name : 'Usuario';
    const greeting = this.getGreetingByTime();

    // Estructura general con Sidebar y Viewport
    const layout = document.createElement('div');
    layout.className = 'app-layout';

    layout.innerHTML = `
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      
      <!-- Sidebar Lateral -->
      <aside class="sidebar" id="app-sidebar">
        <div class="sidebar-top-group">
          <!-- Logo Oficial -->
          <div class="sidebar-logo-container">
            <svg width="30" height="30" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="#141418" stroke="#1c1c22" stroke-width="4"/>
              <path d="M 80 15 A 65 65 0 0 1 133.24 117.28 L 108.67 100.08 A 35 35 0 0 0 80 45 Z" fill="#9b7e47"/>
              <path d="M 133.24 117.28 A 65 65 0 0 1 42.72 133.24 L 59.92 108.67 A 35 35 0 0 0 108.67 100.08 Z" fill="#406371"/>
              <path d="M 42.72 133.24 A 65 65 0 0 1 17.21 63.18 L 46.19 70.94 A 35 35 0 0 0 59.92 108.67 Z" fill="#4a7051"/>
              <path d="M 17.21 63.18 A 65 65 0 0 1 80 15 L 80 45 A 35 35 0 0 0 46.19 70.94 Z" fill="#7d4b4e"/>
              <circle cx="80" cy="80" r="35" fill="#0f0f13"/>
              <path d="M 77.5 80 L 79.2 24 A 1 1 0 0 1 81.5 24 L 82.5 80 Z" fill="#bfa05d"/>
              <circle cx="80" cy="80" r="6" fill="#bfa05d"/>
            </svg>
            <span class="sidebar-brand-title">Focus Flow</span>
          </div>

          <!-- Navegación -->
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

        <!-- Usuario anclado en la parte inferior -->
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

      <!-- Viewport Principal -->
      <div class="main-viewport">
        <div class="topbar-mobile">
          <button class="icon-btn" id="btn-toggle-sidebar">☰</button>
          <span style="font-weight: 600;">Focus Flow</span>
          <div style="width: 24px;"></div>
        </div>
        <div id="route-container"></div>
      </div>
    `;

    // Renderizar la vista correspondiente
    const routeContainer = layout.querySelector('#route-container') as HTMLElement;
    routeContainer.appendChild(this.getViewElement(this.currentRoute, params));

    // Eventos de Navegación
    layout.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = (e.currentTarget as HTMLElement).getAttribute('data-route') as Route;
        if (route) this.navigate(route);
      });
    });

    // Edición de usuario desde el Sidebar
    layout.querySelector('#btn-edit-user-sidebar')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const currentUser = StorageService.getUser();
      const currentName = currentUser ? currentUser.name : 'Usuario';
      
      const newName = await ModalService.prompt(
        'Nombre de usuario',
        'Ingresa tu nuevo nombre o apodo:',
        currentName,
        UI_ICONS.edit
      );

      if (newName !== null && newName.trim() !== '') {
        StorageService.saveUser(newName.trim().slice(0, 20));
        this.refreshCurrentRoute();
      }
    });

    // Control de Sidebar Móvil
    const sidebar = layout.querySelector('#app-sidebar') as HTMLElement;
    const backdrop = layout.querySelector('#sidebar-backdrop') as HTMLElement;
    const toggleBtn = layout.querySelector('#btn-toggle-sidebar');

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

    layout.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      });
    });

    this.appElement.appendChild(layout);
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