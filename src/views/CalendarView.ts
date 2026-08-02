// src/views/CalendarView.ts
import { AppRouter } from '../app';

export class CalendarView {
  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'calendar-page-container';

    const now = new Date();
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentMonthName = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // Días del mes actual
    const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, now.getMonth(), 1).getDay();
    // Ajuste para iniciar en Lunes (0: LU, 6: DO)
    const adjustedFirstDay = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);

    view.innerHTML = `
      <header class="section-top-bar">
        <div class="header-left">
          <button class="icon-btn" id="btn-back" title="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 class="serif-title page-title">Calendario</h2>
        </div>
      </header>

      <main class="calendar-body">
        <div class="month-title-wrapper">
          <h3 class="serif-title month-name">${currentMonthName} <span class="year-text">${currentYear}</span></h3>
        </div>

        <!-- Grilla del Calendario -->
        <div class="calendar-grid">
          <div class="day-header">LU</div>
          <div class="day-header">MA</div>
          <div class="day-header">MI</div>
          <div class="day-header">JU</div>
          <div class="day-header">VI</div>
          <div class="day-header">SÁ</div>
          <div class="day-header">DO</div>

          <!-- Días vacíos de relleno inicial -->
          ${Array(adjustedFirstDay).fill('<div class="day-cell empty"></div>').join('')}

          <!-- Celdas numéricas -->
          ${Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => `
            <div class="day-cell ${day === currentDay ? 'active-today' : ''}">
              <span>${day}</span>
            </div>
          `).join('')}
        </div>

        <!-- Tarjeta de Reportes de Actividad -->
        <div class="activity-report-card">
          <h4>Reportes de actividad</h4>
          <p>
            Aquí podrás visualizar tus horas de enfoque, descanso y procrastinación
            distribuidas por día.
          </p>
          <div class="category-legend">
            <span class="legend-item"><span class="dot gold"></span> Enfoque</span>
            <span class="legend-item"><span class="dot blue"></span> Descanso</span>
            <span class="legend-item"><span class="dot green"></span> Movimiento</span>
            <span class="legend-item"><span class="dot rose"></span> Procrastinar</span>
          </div>
        </div>
      </main>
    `;

    view.querySelector('#btn-back')?.addEventListener('click', () => {
      router.navigate('home');
    });

    return view;
  }
}