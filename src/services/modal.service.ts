// src/services/modal.service.ts

export interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  icon?: string;
}

// src/services/modal.service.ts

export class ModalService {
  static alert(title: string, message: string, icon = 'ℹ️'): Promise<void> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'custom-modal-overlay';
      overlay.innerHTML = `
        <div class="custom-modal-box">
          <div class="modal-icon-header">${icon}</div>
          <h3 class="modal-title">${title}</h3>
          <p class="modal-message">${message}</p>
          <div class="modal-actions-row single">
            <button class="modal-btn modal-btn-confirm" id="btn-modal-ok">Entendido</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const close = () => {
        overlay.remove();
        resolve();
      };

      overlay.querySelector('#btn-modal-ok')?.addEventListener('click', (e) => {
        e.stopPropagation();
        close();
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });
    });
  }

  static confirm(title: string, message: string, icon = '❓'): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'custom-modal-overlay';
      overlay.innerHTML = `
        <div class="custom-modal-box">
          <div class="modal-icon-header">${icon}</div>
          <h3 class="modal-title">${title}</h3>
          <p class="modal-message">${message}</p>
          <div class="modal-actions-row">
            <button class="modal-btn modal-btn-cancel" id="btn-modal-cancel">Cancelar</button>
            <button class="modal-btn modal-btn-confirm" id="btn-modal-confirm">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const close = (result: boolean) => {
        overlay.remove();
        resolve(result);
      };

      overlay.querySelector('#btn-modal-cancel')?.addEventListener('click', (e) => {
        e.stopPropagation();
        close(false);
      });

      overlay.querySelector('#btn-modal-confirm')?.addEventListener('click', (e) => {
        e.stopPropagation();
        close(true);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });
    });
  }

  /**
   * Modal de Entrada con soporte dinámico para Texto y Números
   */
  static prompt(
    title: string,
    message: string,
    defaultValue = '',
    icon = '🎯',
    inputType: 'text' | 'number' = 'text',
    maxLength = 20,
    min = 1,
    max = 1440
  ): Promise<string | null> {
    return new Promise((resolve) => {
      document.querySelectorAll('.custom-modal-overlay').forEach((el) => el.remove());

      const overlay = document.createElement('div');
      overlay.className = 'custom-modal-overlay';

      const inputAttributes =
        inputType === 'number'
          ? `type="number" min="${min}" max="${max}"`
          : `type="text" maxlength="${maxLength}"`;

      overlay.innerHTML = `
        <div class="custom-modal-box">
          <div class="modal-icon-header">${icon}</div>
          <h3 class="modal-title">${title}</h3>
          <p class="modal-message">${message}</p>
          <div class="modal-input-field-wrap">
            <input 
              ${inputAttributes}
              id="modal-prompt-input" 
              class="modal-prompt-input" 
              value="${defaultValue}" 
              placeholder="${inputType === 'text' ? 'Máximo 20 letras...' : 'Minutos...'}"
              autocomplete="off" 
              spellcheck="false"
            />
          </div>
          <div class="modal-actions-row">
            <button type="button" class="modal-btn modal-btn-cancel" id="btn-modal-cancel">Cancelar</button>
            <button type="button" class="modal-btn modal-btn-confirm" id="btn-modal-confirm">Guardar</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const input = overlay.querySelector('#modal-prompt-input') as HTMLInputElement;
      const btnCancel = overlay.querySelector('#btn-modal-cancel') as HTMLButtonElement;
      const btnConfirm = overlay.querySelector('#btn-modal-confirm') as HTMLButtonElement;

      setTimeout(() => {
        input?.focus();
        input?.select();
      }, 50);

      let isClosed = false;
      const close = (val: string | null) => {
        if (isClosed) return;
        isClosed = true;
        overlay.remove();
        resolve(val);
      };

      btnCancel?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close(null);
      });

      btnConfirm?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close(input ? input.value.trim() : null);
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(null);
      });

      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          close(input.value.trim());
        } else if (e.key === 'Escape') {
          e.preventDefault();
          close(null);
        }
      });
    });
  }
}

//   private static showModal(options: ModalOptions & { onConfirm?: () => void; onCancel?: () => void }) {
//     Eliminar modales previos si existen
//     const existing = document.querySelector('.custom-modal-overlay');
//     if (existing) existing.remove();

//     const overlay = document.createElement('div');
//     overlay.className = 'custom-modal-overlay';

//     overlay.innerHTML = `
//       <div class="custom-modal-card">
//         <div class="custom-modal-header">
//           <span class="custom-modal-icon">${options.icon || '💬'}</span>
//           <h3 class="custom-modal-title">${options.title}</h3>
//         </div>
//         <p class="custom-modal-message">${options.message}</p>
//         <div class="custom-modal-actions">
//           ${options.showCancel ? `
//             <button class="custom-modal-btn btn-cancel" id="modal-btn-cancel">
//               ${options.cancelText || 'Cancelar'}
//             </button>
//           ` : ''}
//           <button class="custom-modal-btn btn-confirm" id="modal-btn-confirm">
//             ${options.confirmText || 'Aceptar'}
//           </button>
//         </div>
//       </div>
//     `;

//     document.body.appendChild(overlay);

//     Animación de entrada
//     requestAnimationFrame(() => {
//       overlay.classList.add('active');
//     });

//     const closeModal = (callback?: () => void) => {
//       overlay.classList.remove('active');
//       setTimeout(() => {
//         overlay.remove();
//         if (callback) callback();
//       }, 200);
//     };

//     overlay.querySelector('#modal-btn-confirm')?.addEventListener('click', () => {
//       closeModal(options.onConfirm);
//     });

//     if (options.showCancel) {
//       overlay.querySelector('#modal-btn-cancel')?.addEventListener('click', () => {
//         closeModal(options.onCancel);
//       });
//     }
//   }
// }