// src/services/tauri.service.ts
import { invoke } from '@tauri-apps/api/core';

export class TauriService {
  static async notifyBlockFinished(title: string, body: string): Promise<void> {
    try {
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (isTauri) {
        const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification');
        let permission = await isPermissionGranted();
        if (!permission) {
          const permissionResult = await requestPermission();
          permission = permissionResult === 'granted';
        }
        if (permission) {
          sendNotification({ title, body });
          return;
        }
      }
    } catch {
      // Fallback silencioso
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') new Notification(title, { body });
        });
      }
    }
  }

  /**
   * Invoca el comando nativo de Rust para encoger y fijar encima
   */
  static async enterMiniMode(): Promise<void> {
    try {
      await invoke('enter_mini_mode');
    } catch (e) {
      console.warn('Ejecutando en entorno Web (no Tauri):', e);
    }
  }

  /**
   * Invoca el comando nativo de Rust para restaurar tamaño
   */
  static async exitMiniMode(): Promise<void> {
    try {
      await invoke('exit_mini_mode');
    } catch (e) {
      console.warn('Ejecutando en entorno Web (no Tauri):', e);
    }
  }
}