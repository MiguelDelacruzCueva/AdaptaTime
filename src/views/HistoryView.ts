// src/views/HistoryView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';

export class HistoryView {
  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'history-container';

    const history = StorageService.getHistory();

    view.innerHTML = `
      <header class="section-top-bar">
        <div class="header-left">
          <button class="icon-btn" id="btn-back" title="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 class="serif-title page-title">Historial</h2>
        </div>
        <span class="session-counter-badge">${history.length} sesiones</span>
      </header>

      <main class="history-body">
        ${history.length === 0 ? `
          <div class="empty-state">
            <p class="empty-description">Aún no has completado ninguna sesión de enfoque.</p>
          </div>
        ` : `
          <div class="history-list">
            ${history.map(session => `
              <div class="flow-card history-card">
                <div class="flow-info">
                  <div class="flow-icon-bars">
                    <span class="bar gold"></span>
                    <span class="bar blue"></span>
                    <span class="bar green"></span>
                  </div>
                  <div class="flow-details">
                    <h4 class="flow-title">${session.flowName}</h4>
                    <span class="flow-meta">${this.formatTimeAgo(session.completedAt)}</span>
                  </div>
                </div>
                <div class="history-right-meta">
                  <span class="duration-badge">${session.totalDurationMinutes}m</span>
                  <span class="blocks-badge">${session.completedBlocks}/${session.totalBlocks} bloques</span>
                  <button class="play-btn mini-play" data-replay-id="${session.flowId}">▶</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </main>
    `;

    view.querySelector('#btn-back')?.addEventListener('click', () => {
      router.navigate('home');
    });

    view.querySelectorAll('[data-replay-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-replay-id');
        router.navigate('active-timer', { flowId: id });
      });
    });

    return view;
  }

  private static formatTimeAgo(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMin < 1) return 'hace un momento';
    if (diffMin < 60) return `hace ${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    return date.toLocaleDateString();
  }
}