import { UserProfile } from '../models/user.model';
import { Flow } from '../models/flow.model';
import { SessionHistory } from '../models/session.model';

const KEYS = {
  USER: 'focus_flow_user',
  FLOWS: 'focus_flow_flows',
  HISTORY: 'focus_flow_history'
};

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
  static getHistory(): SessionHistory[] {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  }

  static addHistoryEntry(entry: SessionHistory): void {
    const history = this.getHistory();
    history.unshift(entry); // Añade al inicio
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  }
}