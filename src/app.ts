// src/app.ts
import { StorageService } from './services/storage.service';
import { OnboardingView } from './views/OnboardingView';
import { HomeView } from './views/HomeView';
import { FlowEditorView } from './views/FlowEditorView';
import { ActiveTimerView } from './views/ActiveTimerView';
import { HistoryView } from './views/HistoryView';
import { CalendarView } from './views/CalendarView';

export type Route = 
  | 'onboarding'
  | 'home'
  | 'flow-editor'
  | 'active-timer'
  | 'history'
  | 'calendar';

export class AppRouter {
  private container: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Contenedor #${containerId} no encontrado en el DOM.`);
    this.container = el;
  }

  public init() {
    // Si ya existe un usuario guardado, va directo a Home. Si no, a Onboarding.
    const user = StorageService.getUser();
    if (user && user.name.trim() !== '') {
      this.navigate('home');
    } else {
      this.navigate('onboarding');
    }
  }

  public navigate(route: Route, params: Record<string, unknown> = {}) {
    this.container.innerHTML = ''; // Limpia la vista anterior

    switch (route) {
      case 'onboarding':
        this.container.appendChild(OnboardingView.render(this));
        break;
      case 'home':
        this.container.appendChild(HomeView.render(this));
        break;
      case 'flow-editor':
        this.container.appendChild(FlowEditorView.render(this, params));
        break;
      case 'active-timer':
        this.container.appendChild(ActiveTimerView.render(this, params));
        break;
      case 'history':
        this.container.appendChild(HistoryView.render(this));
        break;
      case 'calendar':
        this.container.appendChild(CalendarView.render(this));
        break;
      default:
        this.container.appendChild(HomeView.render(this));
    }
  }
}