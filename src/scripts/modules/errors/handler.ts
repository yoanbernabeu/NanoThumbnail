import { t } from '../../i18n/index';
import { getErrorModalTemplate } from './Modal';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

export interface ErrorModalOptions {
  title?: string;
  message?: string;
  statusCode?: number | string;
  errorDetails?: Record<string, unknown> | string;
  actionUrl?: string;
  actionLabel?: string;
}

/**
 * Display a professional, generic error modal.
 */
export function showErrorModal(options: ErrorModalOptions = {}): void {
  const { title, message, statusCode, errorDetails, actionUrl, actionLabel } = options;
  
  // Prepare Default Generic Texts
  const defaultTitle = t('error.generic_title') || 'System Notification';
  const defaultMessage = t('error.generic_message') || 'An unexpected issue occurred while processing your request.';

  // Create or Get Modal
  let modal = document.getElementById('errorModal');
  if (!modal) {
    modal = createErrorModal();
    document.body.appendChild(modal);
  }

  // Hydrate Elements
  const els = {
    title: modal.querySelector('.error-modal-title') as HTMLElement | null,
    message: modal.querySelector('.error-modal-message') as HTMLElement | null,
    badge: modal.querySelector('.error-status-badge') as HTMLElement | null,
    badgeWrapper: modal.querySelector('.error-status-wrapper') as HTMLElement | null,
    details: modal.querySelector('.error-details-content') as HTMLElement | null,
    actionWrapper: modal.querySelector('.error-modal-actions') as HTMLElement | null,
    actionBtn: modal.querySelector('.error-action-btn') as HTMLButtonElement | null,
    detailsContainer: modal.querySelector('.error-details-container') as HTMLElement | null,
    toggleIcon: modal.querySelector('.error-details-toggle i') as HTMLElement | null
  };

  // Reset UI state
  if (els.detailsContainer) els.detailsContainer.classList.add('hidden');
  if (els.toggleIcon) els.toggleIcon.style.transform = 'rotate(0deg)';

  // Set Text Content (Fallback to defaults)
  if (els.title) els.title.textContent = title || defaultTitle;
  if (els.message) els.message.textContent = message || defaultMessage;

  // Handle Status Code Badge
  if (statusCode && els.badge) {
    els.badge.textContent = `HTTP ${statusCode}`;
    els.badgeWrapper?.classList.remove('hidden');
  } else if (els.badgeWrapper) {
    els.badgeWrapper.classList.add('hidden');
  }

  // Handle Technical Details (JSON formatting)
  if (els.details) {
    if (errorDetails) {
      try {
        // Handle both objects and string errors
        const content = typeof errorDetails === 'object'
          ? JSON.stringify(errorDetails, null, 2)
          : String(errorDetails);

        els.details.textContent = content;
        Prism.highlightElement(els.details);
      } catch {
        els.details.textContent = String(errorDetails);
      }
    } else {
      els.details.textContent = t('error.no_details_available') || 'No additional technical details available.';
    }
  }

  // Handle Action Button (Call To Action)
  if (els.actionWrapper && els.actionBtn) {
    if (actionUrl) {
      els.actionWrapper.classList.remove('hidden');
      els.actionBtn.textContent = actionLabel || t('error.resolve_issue') || 'Resolve Issue';
      els.actionBtn.style.display = 'inline-flex';
      els.actionBtn.onclick = () => window.open(actionUrl, '_blank', 'noopener,noreferrer');
    } else {
      els.actionWrapper.classList.add('hidden');
    }
  }

  // Display
  modal.classList.remove('hidden');
  requestAnimationFrame(() => modal?.classList.add('show'));
}

/**
 * Create the modal DOM structure using the component template
 */
function createErrorModal(): HTMLElement {
  const modal = document.createElement('div');
  modal.id = 'errorModal';
  modal.className = 'error-modal-overlay hidden';
  modal.innerHTML = getErrorModalTemplate();

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeErrorModal();
  });
  
  // Attach event listeners via data-action
  modal.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const action = target.closest('[data-action]')?.getAttribute('data-action');
    
    switch (action) {
      case 'closeErrorModal':
        closeErrorModal();
        break;
      case 'toggleErrorDetails':
        toggleErrorDetails();
        break;
      case 'copyErrorDetails':
        copyErrorDetails();
        break;
    }
  });

  return modal;
}

/**
 * Close animation and cleanup
 */
export function closeErrorModal(): void {
  const modal = document.getElementById('errorModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
}

/**
 * Toggle details visibility
 */
export function toggleErrorDetails(): void {
  const modal = document.getElementById('errorModal');
  if (!modal) return;

  const container = modal.querySelector('.error-details-container') as HTMLElement | null;
  const icon = modal.querySelector('.error-details-toggle i') as HTMLElement | null;

  if (container?.classList.contains('hidden')) {
    container.classList.remove('hidden');
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    container?.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
}

/**
 * Utility: Copy error details to clipboard for support
 */
export function copyErrorDetails(): void {
  const content = document.querySelector('.error-details-content');
  if (content && navigator.clipboard) {
    navigator.clipboard.writeText(content.textContent || '')
      .then(() => alert(t('error.copied_to_clipboard') || 'Copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err));
  }
}
