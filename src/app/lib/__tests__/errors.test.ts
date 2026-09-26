import { describe, expect, it } from 'vitest';
import { explainError } from '../errors';
import { ProviderError } from '../providers';

const err = (status: number, message = 'x') => new ProviderError(message, status, {}, 'replicate');

describe('explainError', () => {
  it('maps provider statuses to user-facing messages', () => {
    expect(explainError(err(401)).key).toBe('errors.auth');
    expect(explainError(err(402)).key).toBe('errors.credit');
    expect(explainError(err(429)).key).toBe('errors.rate');
    expect(explainError(err(413)).key).toBe('errors.tooLarge');
    expect(explainError(err(422, 'Prompt was flagged as sensitive')).key).toBe('errors.safety');
    expect(explainError(err(500)).key).toBe('errors.generic');
  });

  it('does not blame the key when our proxy refuses the origin', () => {
    expect(explainError(err(403, 'Origin not allowed')).key).toBe('errors.generic');
  });

  it('recognises timeouts, aborts and network errors', () => {
    expect(explainError(new DOMException('t', 'TimeoutError')).key).toBe('errors.timeout');
    expect(explainError(new DOMException('a', 'AbortError')).key).toBe('canvas.canceled');
    expect(explainError(new TypeError('Failed to fetch')).key).toBe('errors.network');
  });
});
