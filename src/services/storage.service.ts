import { UserProfile } from '../models/user.model';
import { Flow } from '../models/flow.model';
import { SessionHistory } from '../models/session.model';

const KEYS = {
  USER: 'focus_flow_user',
  FLOWS: 'focus_flow_flows',
  HISTORY: 'focus_flow_history'
};
export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
}
export interface HistoryItem {
  id: string;
  flowId?: string;
  flowName: string;
  completedAt: string;
  totalDurationMinutes: number;
}

export class StorageService {
  // --- USUARIO ---
  static getUser(): UserProfile | null {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  }

  static saveUser(name: string): UserProfile {
    const user: UserProfile = { id: 1, name };
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    return user;
  }

  // --- FLUJOS ---
  static getFlows(): Flow[] {
    const data = localStorage.getItem(KEYS.FLOWS);
    return data ? JSON.parse(data) : [];
  }

  static saveFlow(flow: Flow): void {
    const flows = this.getFlows();
    const index = flows.findIndex(f => f.id === flow.id);
    if (index >= 0) {
      flows[index] = flow;
    } else {
      flows.push(flow);
    }
    localStorage.setItem(KEYS.FLOWS, JSON.stringify(flows));
  }

  // --- HISTORIAL ---
  static getHistory(): HistoryItem[] {
    const data = localStorage.getItem('focus_flow_history');
    return data ? JSON.parse(data) : [];
  }

  static addHistoryEntry(entry: SessionHistory): void {
    const history = this.getHistory();
    history.unshift(entry); // Añade al inicio
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  }
  static getTasks(): TaskItem[] {
    const data = localStorage.getItem('focus_flow_tasks');
    return data ? JSON.parse(data) : [
      { id: '1', title: 'Avanzar informe de proyecto', completed: false },
      { id: '2', title: 'Revisar pendientes del flujo', completed: true }
    ];
  }

  static saveTasks(tasks: TaskItem[]): void {
    localStorage.setItem('focus_flow_tasks', JSON.stringify(tasks));
  }

  static addTask(title: string): TaskItem[] {
    const tasks = this.getTasks();
    const newTask: TaskItem = { id: crypto.randomUUID(), title, completed: false };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return tasks;
  }

  static toggleTask(id: string): TaskItem[] {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
    this.saveTasks(tasks);
    return tasks;
  }

  static deleteTask(id: string): TaskItem[] {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
    return tasks;
  }
  

  static recordSession(session: HistoryItem): void {
    const history = this.getHistory();
    history.unshift(session);
    localStorage.setItem('focus_flow_history', JSON.stringify(history));
  }
}