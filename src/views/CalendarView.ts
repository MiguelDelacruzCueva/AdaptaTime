// src/views/CalendarView.ts
import { AppRouter } from '../app';
import { StorageService, HistoryItem } from '../services/storage.service';
import { BlockType } from '../models/flow.model';

export class CalendarView {
  private static currentDate: Date = new Date();
  private static selectedDate: Date = new Date();

  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'calendar-page-container';

    this.renderContent(view, router);
    return view;
  }

  private static renderContent(view: HTMLElement, router: AppRouter) {
    const appStart = StorageService.getAppStartDate();
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const isAtStartMonth = 
      year < appStart.getFullYear() || 
      (year === appStart.getFullYear() && month <= appStart.getMonth());

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const history = StorageService.getHistory();
    const selectedDateStr = this.selectedDate.toISOString().split('T')[0];
    const dayHistory = history.filter(h => h.completedAt.startsWith(selectedDateStr));

    // Sumatoria de todas las acciones del día seleccionado
    const breakdown: Record<BlockType, number> = {
      ENFOQUE: 0, DESCANSO: 0, MOVIMIENTO: 0, PROCRASTINAR: 0
    };

    let totalMinutesDay = 0;
    dayHistory.forEach(item => {
      totalMinutesDay += item.totalDurationMinutes;
      if (item.breakdown) {
        breakdown.ENFOQUE += item.breakdown.ENFOQUE || 0;
        breakdown.DESCANSO += item.breakdown.DESCANSO || 0;
        breakdown.MOVIMIENTO += item.breakdown.MOVIMIENTO || 0;
        breakdown.PROCRASTINAR += item.breakdown.PROCRASTINAR || 0;
      } else {
        breakdown.ENFOQUE += item.totalDurationMinutes;
      }
    });

    const dailyGoal = StorageService.getDailyGoal();
    // Progreso real frente al objetivo diario (Ej: 9m de 50m = 18%)
    const goalProgressPct = dailyGoal > 0 ? Math.min(100, Math.round((totalMinutesDay / dailyGoal) * 100)) : 0;

    view.innerHTML = `
      <header class="calendar-header-nav">
        <button class="icon-btn" id="btn-back-home" title="Volver al inicio">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 class="calendar-main-title">Calendario</h2>
      </header>

      <div class="calendar-layout-grid">
        <!-- SECCIÓN IZQUIERDA: MATRIZ DE CALENDARIO -->
        <div class="calendar-box-card">
          <div class="calendar-month-selector">
            <div class="month-title-wrap">
              <span class="month-name-big">${monthNames[month]}</span>
              <span class="year-name-muted">${year}</span>
            </div>
            <div class="month-nav-btns">
              <button class="icon-btn-pill" id="btn-prev-month" ${isAtStartMonth ? 'disabled style="opacity:0.25; cursor:not-allowed;"' : ''}>◀</button>
              <button class="icon-btn-pill" id="btn-next-month">▶</button>
            </div>
          </div>

          <div class="weekdays-row">
            <span>LU</span><span>MA</span><span>MI</span><span>JU</span><span>VI</span><span>SÁ</span><span>DO</span>
          </div>

          <div class="days-grid-matrix">
            ${this.renderDaysMatrix(year, month, history)}
          </div>
        </div>

        <!-- SECCIÓN DERECHA: RESUMEN DE ACTIVIDAD Y DISTRIBUCIÓN -->
        <div class="activity-report-card">
          <div class="report-header-row">
            <div>
              <span class="report-subtitle-label">RESUMEN DEL DÍA</span>
              <h3 class="report-date-title">
                ${this.selectedDate.getDate()} de ${monthNames[this.selectedDate.getMonth()]}, ${this.selectedDate.getFullYear()}
              </h3>
            </div>
          </div>

          <!-- Métricas Numéricas -->
          <div class="report-kpi-row">
            <div class="kpi-card">
              <span class="kpi-val">${totalMinutesDay}m</span>
              <span class="kpi-lbl">Tiempo Total</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-val" style="color: var(--color-enfoque, #e5c158);">${goalProgressPct}%</span>
              <span class="kpi-lbl">Meta (${dailyGoal}m)</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-val">${dayHistory.length}</span>
              <span class="kpi-lbl">Sesiones</span>
            </div>
          </div>

          <!-- Gráfico de Distribución de Tiempo -->
          <div class="chart-section">
            <span class="section-micro-label">DISTRIBUCIÓN DE TIEMPO</span>
            <div class="stacked-bar-container">
              ${totalMinutesDay === 0 ? `
                <div class="stacked-bar-empty">Sin actividad registrada</div>
              ` : `
                <div class="stacked-bar-track">
                  ${(Object.keys(breakdown) as BlockType[]).map(type => {
                    const mins = breakdown[type];
                    if (mins === 0) return '';
                    const pct = ((mins / totalMinutesDay) * 100).toFixed(1);
                    return `<div class="bar-slice ${type.toLowerCase()}" style="width: ${pct}%;" title="${type}: ${mins}m (${pct}%)"></div>`;
                  }).join('')}
                </div>
              `}
            </div>
          </div>

          <!-- Desglose por Minutos -->
          <div class="breakdown-legend-grid">
            <div class="legend-item enfoque">
              <span class="legend-dot"></span>
              <div class="legend-texts">
                <span>Enfoque</span>
                <strong>${breakdown.ENFOQUE}m</strong>
              </div>
            </div>
            <div class="legend-item descanso">
              <span class="legend-dot"></span>
              <div class="legend-texts">
                <span>Descanso</span>
                <strong>${breakdown.DESCANSO}m</strong>
              </div>
            </div>
            <div class="legend-item movimiento">
              <span class="legend-dot"></span>
              <div class="legend-texts">
                <span>Movimiento</span>
                <strong>${breakdown.MOVIMIENTO}m</strong>
              </div>
            </div>
            <div class="legend-item procrastinar">
              <span class="legend-dot"></span>
              <div class="legend-texts">
                <span>Procrastinar</span>
                <strong>${breakdown.PROCRASTINAR}m</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(view, router);
  }

  private static renderDaysMatrix(year: number, month: number, history: HistoryItem[]): string {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex === 0 ? 7 : firstDayIndex) - 1;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    for (let i = 0; i < startOffset; i++) {
      html += `<div class="day-cell empty-cell"></div>`;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const selectedStr = this.selectedDate.toISOString().split('T')[0];

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dayDateStr === todayStr;
      const isSelected = dayDateStr === selectedStr;
      const hasActivity = history.some(h => h.completedAt.startsWith(dayDateStr));

      html += `
        <div 
          class="day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasActivity ? 'has-data' : ''}" 
          data-date="${dayDateStr}"
        >
          <span>${day}</span>
          ${hasActivity ? '<span class="activity-pip"></span>' : ''}
        </div>
      `;
    }

    return html;
  }

  private static bindEvents(view: HTMLElement, router: AppRouter) {
    view.querySelector('#btn-back-home')?.addEventListener('click', () => router.navigate('home'));

    view.querySelector('#btn-prev-month')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderContent(view, router);
    });

    view.querySelector('#btn-next-month')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderContent(view, router);
    });

    view.querySelectorAll('.day-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const dateStr = (e.currentTarget as HTMLElement).getAttribute('data-date');
        if (dateStr) {
          const parts = dateStr.split('-');
          this.selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          this.renderContent(view, router);
        }
      });
    });
  }
}