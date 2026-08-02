// src/main.ts
import { AppRouter } from './app';
import { TauriService } from './services/tauri.service';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar notificaciones del SO
  TauriService.init();

  const router = new AppRouter('app');
  router.init();
});