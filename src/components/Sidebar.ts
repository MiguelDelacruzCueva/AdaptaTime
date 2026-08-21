// src/components/Sidebar.ts
import { StorageService } from '../services/storage.service';
import { UI_ICONS } from '../utils/icons';

export class Sidebar {
  static render(activeRoute: string): string {
    const user = StorageService.getUser();
    const userName = user ? user.name : 'Usuario';
    const greetingText = this.getGreetingByTime();

    return `
      <aside class="sidebar">
        <!-- ZONA SUPERIOR: LOGO Y NAVEGACIÓN -->
        <div class="sidebar-top-group">
          <div class="sidebar-logo-container">
            <svg width="32" height="32" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="#141418" stroke="#1c1c22" stroke-width="4"/>
              <path d="M 80 15 A 65 65 0 0 1 133.24 117.28 L 108.67 100.08 A 35 35 0 0 0 80 45 Z" fill="#9b7e47"/>
              <path d="M 133.24 117.28 A 65 65 0 0 1 42.72 133.24 L 59.92 108.67 A 35 35 0 0 0 108.67 100.08 Z" fill="#406371"/>
              <path d="M 42.72 133.24 A 65 65 0 0 1 17.21 63.18 L 46.19 70.94 A 35 35 0 0 0 59.92 108.67 Z" fill="#4a7051"/>
              <path d="M 17.21 63.18 A 65 65 0 0 1 80 15 L 80 45 A 35 35 0 0 0 46.19 70.94 Z" fill="#7d4b4e"/>
              <circle cx="80" cy="80" r="35" fill="#0f0f13"/>
              <path d="M 77.5 80 L 79.2 24 A 1 1 0 0 1 81.5 24 L 82.5 80 Z" fill="#bfa05d"/>
              <circle cx="80" cy="80" r="6" fill="#bfa05d"/>
            </svg>
            <span class="sidebar-logo-title">Focus Flow</span>
          </div>

          <nav class="sidebar-nav">
            <button class="nav-item ${activeRoute === 'home' ? 'active' : ''}" data-route="home">
              <span>-</span> Inicio
            </button>
            <button class="nav-item ${activeRoute === 'flow-editor' ? 'active' : ''}" data-route="flow-editor">
              <span>-</span> Nuevo flujo
            </button>
            <button class="nav-item ${activeRoute === 'live-timer' ? 'active' : ''}" data-route="live-timer">
              <span>-</span> Cronómetro
            </button>
            <button class="nav-item ${activeRoute === 'calendar' ? 'active' : ''}" data-route="calendar">
              <span>-</span> Calendario
            </button>
          </nav>
        </div>

        <!-- ZONA INFERIOR: USUARIO Y SALUDO -->
        <div class="sidebar-user-footer">
          <div class="sidebar-user-info">
            <span class="sidebar-greeting-label">${greetingText}</span>
            <div class="sidebar-user-name-row">
              <h4 class="sidebar-user-name" title="${userName}">${userName}</h4>
              <button class="icon-btn" id="btn-sidebar-edit-name" title="Editar nombre">
                ${UI_ICONS.edit}
              </button>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  private static getGreetingByTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'BUENOS DÍAS';
    if (hour < 19) return 'BUENAS TARDES';
    return 'BUENAS NOCHES';
  }
}