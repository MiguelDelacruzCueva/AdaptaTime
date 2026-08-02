import { AppRouter } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const router = new AppRouter('app');
  router.init();
});