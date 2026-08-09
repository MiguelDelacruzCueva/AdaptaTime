// src/main.ts
import './styles/main.css';
import './styles/editor.css';
import './styles/timer.css';
import { AppRouter } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app') || document.body;
  const router = new AppRouter(appElement);
  router.init();
});