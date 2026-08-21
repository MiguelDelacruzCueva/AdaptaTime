// src/services/tauri.service.ts// En src/services/tauri.service.ts
import { invoke } from '@tauri-apps/api/core';

export class TauriService {
  static async minimize(): Promise<void> {
    try { await invoke('minimize_window'); } catch {}
  }

  static async toggleMaximize(): Promise<void> {
    try { await invoke('toggle_maximize'); } catch {}
  }

  static async close(): Promise<void> {
    try { await invoke('close_app'); } catch {}
  }

  static async enterMiniMode(): Promise<void> {
    try { await invoke('enter_mini_mode'); } catch {}
  }

  static async exitMiniMode(): Promise<void> {
    try { await invoke('exit_mini_mode'); } catch {}
  }

  // En src/services/tauri.service.ts

  static async startDragging(): Promise<void> {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startDragging();
    } catch {
      try {
        await invoke('start_window_drag');
      } catch {}
    }
  }

  static async notifyBlockFinished(title: string, body: string): Promise<void> {
    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (isTauri) {
        const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification');
        let permission = await isPermissionGranted();
        if (!permission) {
          const res = await requestPermission();
          permission = res === 'granted';
        }
        if (permission) {
          sendNotification({ title, body });
          return;
        }
      }
    } catch {}

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }
}