// src/services/modal.service.ts

export interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  icon?: string;
}

export class ModalService {
  /**
   * Muestra una alerta personalizada no bloqueante.
   */
  static alert(title: string, message: string, icon: string = '✨'): Promise<void> {
    return new Promise((resolve) => {
      this.showModal({
        title,
        message,
        icon,
        confirmText: 'Aceptar',
        showCancel: false,
        onConfirm: () => resolve()
      });
    });
  }

  /**
   * Muestra un diálogo de confirmación personalizado.
   */
  static confirm(title: string, message: string, icon: string = '⚠️'): Promise<boolean> {
    return new Promise((resolve) => {
      this.showModal({
        title,
        message,
        icon,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        showCancel: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }

  private static showModal(options: ModalOptions & { onConfirm?: () => void; onCancel?: () => void }) {
    // Eliminar modales previos si existen
    const existing = document.querySelector('.custom-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';

    overlay.innerHTML = `
      <div class="custom-modal-card">
        <div class="custom-modal-header">
          <span class="custom-modal-icon">${options.icon || '💬'}</span>
          <h3 class="custom-modal-title">${options.title}</h3>
        </div>
        <p class="custom-modal-message">${options.message}</p>
        <div class="custom-modal-actions">
          ${options.showCancel ? `
            <button class="custom-modal-btn btn-cancel" id="modal-btn-cancel">
              ${options.cancelText || 'Cancelar'}
            </button>
          ` : ''}
          <button class="custom-modal-btn btn-confirm" id="modal-btn-confirm">
            ${options.confirmText || 'Aceptar'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Animación de entrada
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    const closeModal = (callback?: () => void) => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        if (callback) callback();
      }, 200);
    };

    overlay.querySelector('#modal-btn-confirm')?.addEventListener('click', () => {
      closeModal(options.onConfirm);
    });

    if (options.showCancel) {
      overlay.querySelector('#modal-btn-cancel')?.addEventListener('click', () => {
        closeModal(options.onCancel);
      });
    }
  }
}