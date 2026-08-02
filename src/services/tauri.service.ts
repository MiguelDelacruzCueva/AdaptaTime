// src/services/tauri.service.ts
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export class TauriService {
  private static permissionGranted = false;

  static async init() {
    try {
      this.permissionGranted = await isPermissionGranted();
      if (!this.permissionGranted) {
        const permission = await requestPermission();
        this.permissionGranted = permission === 'granted';
      }
    } catch (e) {
      console.warn('Entorno web o notificaciones no disponibles:', e);
    }
  }

  static async notifyBlockFinished(title: string, body: string) {
    try {
      if (this.permissionGranted) {
        sendNotification({ title, body });
      } else {
        console.log(`[Notificación en consola] ${title}: ${body}`);
      }
    } catch (e) {
      console.warn('Error al enviar notificación:', e);
    }
  }
}