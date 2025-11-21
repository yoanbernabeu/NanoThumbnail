import { t } from '../../i18n/i18n.js';
import { getErrorModalTemplate } from './components/Modal.js';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

/**
 * Display a professional, generic error modal.
 * 
 * * Usage examples:
 * 1. Simple: showErrorModal({ errorDetails: err });
 * 2. Custom: showErrorModal({ title: 'Login Failed', message: 'Bad password', statusCode: 401 });
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.title] - Custom title (defaults to generic system error)
 * @param {string} [options.message] - Custom message (defaults to generic explanation)
 * @param {number|string} [options.statusCode] - HTTP status code (e.g., 404, 500)
 * @param {Object|string} [options.errorDetails] - The raw error object or stack trace
 * @param {string} [options.actionUrl] - Optional URL for a CTA (e.g., 'https://status.io')
 * @param {string} [options.actionLabel] - Label for the CTA button
 */
export function showErrorModal({ title, message, statusCode, errorDetails, actionUrl, actionLabel } = {}) {
    // Prepare Default Generic Texts
    const defaultTitle = t('error.generic_title') || 'System Notification';
    const defaultMessage = t('error.generic_message') || 'An unexpected issue occurred while processing your request. We have logged this event. Please review the technical details below if the problem persists.';

    // Create or Get Modal
    let modal = document.getElementById('errorModal');
    if (!modal) {
        modal = createErrorModal();
        document.body.appendChild(modal);
    }

    // Hydrate Elements
    const els = {
        title: modal.querySelector('.error-modal-title'),
        message: modal.querySelector('.error-modal-message'),
        badge: modal.querySelector('.error-status-badge'),
        badgeWrapper: modal.querySelector('.error-status-wrapper'),
        details: modal.querySelector('.error-details-content'),
        actionWrapper: modal.querySelector('.error-modal-actions'),
        actionBtn: modal.querySelector('.error-action-btn'),
        detailsContainer: modal.querySelector('.error-details-container'),
        toggleIcon: modal.querySelector('.error-details-toggle i')
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
        els.badgeWrapper.classList.remove('hidden');
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
            } catch (e) {
                els.details.textContent = String(errorDetails);
            }
        } else {
            els.details.textContent = t('no_details_available') || 'No additional technical details available.';
        }
    }

    // Handle Action Button (Call To Action)
    if (els.actionWrapper && els.actionBtn) {
        if (actionUrl) {
            els.actionWrapper.classList.remove('hidden');
            els.actionBtn.textContent = actionLabel || t('resolve_issue') || 'Resolve Issue';
            els.actionBtn.style.display = 'inline-flex';
            els.actionBtn.onclick = () => window.open(actionUrl, '_blank', 'noopener,noreferrer');
        } else {
            els.actionWrapper.classList.add('hidden');
        }
    }

    // Display
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('show'));
}

/**
 * Create the modal DOM structure using the component template
 */
function createErrorModal() {
    const modal = document.createElement('div');
    modal.id = 'errorModal';
    modal.className = 'error-modal-overlay hidden';
    modal.innerHTML = getErrorModalTemplate();

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeErrorModal();
    });

    return modal;
}

/**
 * Close animation and cleanup
 */
export function closeErrorModal() {
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
export function toggleErrorDetails() {
    const modal = document.getElementById('errorModal');
    if (!modal) return;

    const container = modal.querySelector('.error-details-container');
    const icon = modal.querySelector('.error-details-toggle i');

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        container.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

/**
 * Utility: Copy error details to clipboard for support
 */
export function copyErrorDetails() {
    const content = document.querySelector('.error-details-content');
    if (content && navigator.clipboard) {
        navigator.clipboard.writeText(content.textContent)
            .then(() => alert(t('error.copied_to_clipboard') || 'Copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
    }
}

// Bind global handlers for HTML onclick attributes
window.showErrorModal = showErrorModal;
window.closeErrorModal = closeErrorModal;
window.toggleErrorDetails = toggleErrorDetails;
window.copyErrorDetails = copyErrorDetails;