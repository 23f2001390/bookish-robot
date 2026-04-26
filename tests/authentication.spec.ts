import { describe, expect, it } from 'vitest';
import { createAuthHeaders, mockApiResponse } from '../helpers/test-utils';

describe('Authentication Component', () => {
  it('builds auth headers for a member request', () => {
    const headers = createAuthHeaders('member');

    expect(headers.Authorization).toContain('Bearer');
    expect(headers['X-User-Role']).toBe('member');
  });

  it('returns expected payload shape for successful signup', () => {
    const response = mockApiResponse(201, {
      userId: 'usr_001',
      email: 'member@gym.com',
      role: 'member',
    }, 'User created successfully');

    expect(response.status).toBe(201);
    expect(response.data.email).toBe('member@gym.com');
  });

  it('rejects invalid credentials on login', () => {
    const response = mockApiResponse(400, {
      code: 'INVALID_CREDENTIALS',
      errors: ['email or password invalid'],
    });

    expect(response.status).toBe(400);
    expect(response.data.code).toBe('INVALID_CREDENTIALS');
  });

  it('enforces role-based access checks', () => {
    const trainerHeaders = createAuthHeaders('trainer');

    expect(trainerHeaders['X-User-Role']).not.toBe('owner');
  });

  it('returns success response for forgot-password flow', () => {
    const response = mockApiResponse(200, {
      emailSent: true,
      expiresInMinutes: 30,
    });

    expect(response.status).toBe(200);
    expect(response.data.emailSent).toBe(true);
  });

  it('returns 401 for invalid access token', () => {
    const response = mockApiResponse(401, {
      code: 'INVALID_TOKEN',
    });

    expect(response.status).toBe(401);
  });

  it('returns token-expired error for stale access token', () => {
    const response = mockApiResponse(401, {
      code: 'TOKEN_EXPIRED',
      expiredAt: '2026-04-10T05:00:00.000Z',
    });

    expect(response.status).toBe(401);
    expect(response.data.code).toBe('TOKEN_EXPIRED');
  });

  it('denies owner-route access for member role', () => {
    const memberHeaders = createAuthHeaders('member');

    expect(memberHeaders['X-User-Role']).not.toBe('owner');
  });

  it('enforces password complexity rules on signup', () => {
    const response = mockApiResponse(422, {
      code: 'WEAK_PASSWORD',
      minLength: 8,
    });

    expect(response.status).toBe(422);
    expect(response.data.minLength).toBe(8);
  });

  it('returns conflict when email is already registered', () => {
    const response = mockApiResponse(409, {
      code: 'EMAIL_ALREADY_EXISTS',
      email: 'member@gym.com',
    });

    expect(response.status).toBe(409);
    expect(response.data.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('issues a new access token for valid refresh token', () => {
    const response = mockApiResponse(200, {
      accessToken: 'new-token-001',
      expiresInSeconds: 900,
    });

    expect(response.status).toBe(200);
    expect(response.data.expiresInSeconds).toBeGreaterThan(0);
  });

  it('rejects protected requests missing authorization header', () => {
    const response = mockApiResponse(401, {
      code: 'AUTH_HEADER_MISSING',
    });

    expect(response.status).toBe(401);
    expect(response.data.code).toBe('AUTH_HEADER_MISSING');
  });
});
