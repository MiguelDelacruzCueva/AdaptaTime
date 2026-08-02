// src/views/ActiveTimerView.ts
import { AppRouter } from '../app';

export class ActiveTimerView {
  static render(router: AppRouter, params: Record<string, unknown> = {}): HTMLElement {
    const view = document.createElement('div');
    view.className = 'active-timer-container';
    view.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h2 class="serif-title">Temporizador Activo</h2>
        <p>Flujo ID: ${params.flowId || 'Sin ID'}</p>
        <button id="btn-back-home" class="btn-gold-pill">← Volver al Home</button>
      </div>
    `;

    view.querySelector('#btn-back-home')?.addEventListener('click', () => {
      router.navigate('home');
    });

    return view;
  }
}