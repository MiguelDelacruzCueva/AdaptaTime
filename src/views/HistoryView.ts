// src/views/HistoryView.ts
import { AppRouter } from '../app';

export class HistoryView {
  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'history-container';
    view.innerHTML = `
      <div style="padding: 2rem;">
        <h2 class="serif-title">Historial</h2>
        <button id="btn-back-home" class="btn-gold-pill">← Volver al Home</button>
      </div>
    `;

    view.querySelector('#btn-back-home')?.addEventListener('click', () => {
      router.navigate('home');
    });

    return view;
  }
}