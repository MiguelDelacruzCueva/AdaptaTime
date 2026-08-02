// src/views/OnboardingView.ts
import { AppRouter } from '../app';
import { StorageService } from '../services/storage.service';

export class OnboardingView {
  static render(router: AppRouter): HTMLElement {
    const view = document.createElement('div');
    view.className = 'welcome-container';

    view.innerHTML = `
      <div class="brand-header">
        <span class="subtitle">FOCUS FLOW</span>
        <h1 class="serif-title">Tu tiempo,<br><i>tu ritmo.</i></h1>
      </div>

      <div class="input-group">
        <label for="username">¿CÓMO TE LLAMAS?</label>
        <input type="text" id="username" placeholder="Tu nombre" autocomplete="off" />
      </div>

      <button id="btn-start" class="btn-primary">
        Comenzar <span class="arrow">›</span>
      </button>

      <div class="color-indicator-bar">
        <span class="bar bar-gold"></span>
        <span class="bar bar-blue"></span>
        <span class="bar bar-green"></span>
        <span class="bar bar-rose"></span>
      </div>
    `;

    const input = view.querySelector('#username') as HTMLInputElement;
    const btn = view.querySelector('#btn-start') as HTMLButtonElement;

    const handleStart = () => {
      const name = input.value.trim();
      if (name) {
        StorageService.saveUser(name);
        router.navigate('home');
      } else {
        input.focus();
      }
    };

    btn.addEventListener('click', handleStart);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleStart();
    });

    return view;
  }
}