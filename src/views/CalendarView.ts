// src/views/CalendarView.ts
import { AppRouter } from '../app';

export class CalendarView {
  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'calendar-container';
    view.innerHTML = `
      <div style="padding: 2rem;">
        <h2 class="serif-title">Calendario</h2>
        <button id="btn-back-home" class="btn-gold-pill">← Volver al Home</button>
      </div>
    `;

    view.querySelector('#btn-back-home')?.addEventListener('click', () => {
      router.navigate('home');
    });

    return view;
  }
}