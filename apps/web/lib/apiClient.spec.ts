import { normalizeError } from './apiClient';

describe('apiClient normalizeError', () => {
  it('normalizes code and message from response body', async () => {
    const response = {
      status: 404,
      json: async () => ({ code: 'SESSION_NOT_FOUND', message: 'missing' })
    } as Response;

    const error = await normalizeError(response);
    expect(error.code).toBe('SESSION_NOT_FOUND');
    expect(error.message).toBe('missing');
    expect(error.status).toBe(404);
  });
});
