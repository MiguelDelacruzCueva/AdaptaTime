// src/services/tauri.service.ts

export class TauriService {
  static async notifyBlockFinished(title: string, body: string): Promise<void> {
    try {
      // Intenta usar la API nativa de Tauri si está disponible
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
      // Silenciamos la advertencia del plugin y pasamos al fallback Web
    }

    // Fallback con la API de Notificaciones estándar de HTML5
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  }
}