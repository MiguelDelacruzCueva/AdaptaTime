// src/services/tauri.service.ts

export class TauriService {
  /**
   * Envía notificación de fin de bloque
   */
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
   * Convierte la ventana en un Mini Widget flotante siempre visible
   */
  static async enterMiniMode(): Promise<void> {
    try {
      const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.setMinSize(new LogicalSize(280, 160));
      await win.setSize(new LogicalSize(310, 180));
      await win.setAlwaysOnTop(true);
      await win.setResizable(false);
    } catch {
      // Modo navegador dev
    }
  }

  /**
   * Restaura la ventana a su tamaño normal de trabajo
   */
  static async exitMiniMode(): Promise<void> {
    try {
      const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.setAlwaysOnTop(false);
      await win.setResizable(true);
      await win.setMinSize(new LogicalSize(598, 600));
      await win.setSize(new LogicalSize(980, 680));
      await win.center();
    } catch {
      // Modo navegador dev
    }
  }
}