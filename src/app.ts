// src/app.ts
import { HomeView } from './views/HomeView';
import { FlowEditorView } from './views/FlowEditorView';
import { ActiveTimerView } from './views/ActiveTimerView';
import { LiveTimerView } from './views/LiveTimerView';
import { CalendarView } from './views/CalendarView';
import { OnboardingView } from './views/OnboardingView';
import { StorageService } from './services/storage.service';

export type Route = 'home' | 'flow-editor' | 'active-timer' | 'live-timer' | 'calendar' | 'onboarding';

export class AppRouter {
  private appElement: HTMLElement;
  private currentRoute: Route = 'home';

  constructor(appElement: HTMLElement) {
    this.appElement = appElement;
  }
  init() {
    const user = StorageService.getUser();
    if (!user) {
      this.navigate('onboarding');
    } else {
      this.navigate('home');
    }
  }

  navigate(route: Route, params: Record<string, unknown> = {}) {
    this.currentRoute = route;
    this.renderLayout(params);
  }

  private renderLayout(params: Record<string, unknown> = {}) {
    this.appElement.innerHTML = '';

    const user = StorageService.getUser();
    if (!user && this.currentRoute !== 'onboarding') {
      this.currentRoute = 'onboarding';
    }

    // Vistas que ocupan pantalla completa sin Sidebar
    const isFullscreenView = ['active-timer', 'onboarding'].includes(this.currentRoute);

    if (isFullscreenView) {
      const viewContent = this.getViewElement(this.currentRoute, params);
      this.appElement.appendChild(viewContent);
      return;
    }

    // Shell con Sidebar Lateral
    const layout = document.createElement('div');
    layout.className = 'app-layout';

    layout.innerHTML = `
      <!-- Sidebar Lateral Fijo -->
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar" id="app-sidebar">
        <div class="sidebar-brand">
          <span style="color: var(--color-enfoque, #e5c158);"></span> Focus Flow
        </div>

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

    const routeContainer = layout.querySelector('#route-container') as HTMLElement;
    routeContainer.appendChild(this.getViewElement(this.currentRoute, params));

    layout.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const route = (e.currentTarget as HTMLElement).getAttribute('data-route') as Route;
        this.navigate(route);
      });
    });

    // Control bidireccional del Sidebar y Backdrop
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

    // Cerrar el menú automáticamente al hacer clic en una opción en modo responsivo
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
}