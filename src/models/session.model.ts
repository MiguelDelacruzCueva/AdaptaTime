export interface SessionHistory {
  id: string;
  flowId: string;
  flowName: string;
  totalDurationMinutes: number;
  completedBlocks: number;
  totalBlocks: number;
  completedAt: string; // ISO String para agrupar por fechas en el Calendario
}