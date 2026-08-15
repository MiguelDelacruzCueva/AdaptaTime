// En src/components/Sidebar.ts
export class Sidebar {
  static render(activeRoute: string): string {
    return `
      <aside class="sidebar">
        <!-- LOGO OFICIAL FOCUS FLOW -->
        <div class="sidebar-logo-container" style="display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem 0 1.5rem 0;">
          <svg width="34" height="34" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="#141418" stroke="#1c1c22" stroke-width="4"/>
            <path d="M 80 15 A 65 65 0 0 1 133.24 117.28 L 108.67 100.08 A 35 35 0 0 0 80 45 Z" fill="#9b7e47"/>
            <path d="M 133.24 117.28 A 65 65 0 0 1 42.72 133.24 L 59.92 108.67 A 35 35 0 0 0 108.67 100.08 Z" fill="#406371"/>
            <path d="M 42.72 133.24 A 65 65 0 0 1 17.21 63.18 L 46.19 70.94 A 35 35 0 0 0 59.92 108.67 Z" fill="#4a7051"/>
            <path d="M 17.21 63.18 A 65 65 0 0 1 80 15 L 80 45 A 35 35 0 0 0 46.19 70.94 Z" fill="#7d4b4e"/>
            <circle cx="80" cy="80" r="35" fill="#0f0f13"/>
            <path d="M 77.5 80 L 79.2 24 A 1 1 0 0 1 81.5 24 L 82.5 80 Z" fill="#bfa05d"/>
            <circle cx="80" cy="80" r="6" fill="#bfa05d"/>
          </svg>
          <span style="font-family: var(--font-serif, serif); font-style: italic; font-size: 1.35rem; font-weight: 600; color: #fff;">
            Focus Flow
          </span>
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
      </aside>
    `;
  }
}