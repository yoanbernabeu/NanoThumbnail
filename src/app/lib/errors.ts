import { isAbort, ProviderError } from './providers';
import type { TKey } from '../i18n';

/** Maps any thrown value to a translated, user-facing explanation. */
export function explainError(error: unknown): { key: TKey; message: string; details?: unknown; status?: number } {
  if (error instanceof DOMException && error.name === 'TimeoutError') return { key: 'errors.timeout', message: error.message };
  if (isAbort(error)) return { key: 'canvas.canceled', message: 'aborted' };
  if (error instanceof ProviderError) {
    const msg = error.message.toLowerCase();
    const base = { message: error.message, details: error.details, status: error.status };
    if (error.status === 401 || (error.status === 403 && !msg.includes('origin'))) return { key: 'errors.auth', ...base };
    if (error.status === 402 || msg.includes('credit') || msg.includes('billing')) return { key: 'errors.credit', ...base };
    if (error.status === 429 || msg.includes('quota') || msg.includes('rate')) return { key: 'errors.rate', ...base };
    if (error.status === 413) return { key: 'errors.tooLarge', ...base };
    if (msg.includes('safety') || msg.includes('sensitive') || msg.includes('blocked') || msg.includes('prohibited') || msg.includes('nsfw'))
      return { key: 'errors.safety', ...base };
    return { key: 'errors.generic', ...base };
  }
  if (error instanceof TypeError) return { key: 'errors.network', message: error.message };
  return { key: 'errors.generic', message: error instanceof Error ? error.message : String(error) };
}
