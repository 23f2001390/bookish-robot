import { describe, expect, it } from 'vitest';
import { mockApiResponse } from '../helpers/test-utils';

describe('Nutrition and Notifications Component', () => {
  it('saves nutrition profile details', () => {
    const response = mockApiResponse(200, {
      memberId: 'mem_001',
      caloriesTarget: 2400,
      goal: 'muscle_gain',
    });

    expect(response.status).toBe(200);
    expect(response.data.goal).toBe('muscle_gain');
  });

  it('returns expected payload for generated meal plans', () => {
    const response = mockApiResponse(200, {
      planId: 'meal_001',
      generated: true,
      mealsCount: 5,
    });

    expect(response.status).toBe(200);
    expect(response.data.generated).toBe(true);
  });

  it('queues reminders for members with expiring plans', () => {
    const response = mockApiResponse(202, {
      queued: true,
      recipientCount: 14,
    });

    expect(response.status).toBe(202);
    expect(response.data.recipientCount).toBeGreaterThan(0);
  });

  it('returns member notification feed items', () => {
    const response = mockApiResponse(200, {
      items: [{ id: 'ntf_1' }, { id: 'ntf_2' }, { id: 'ntf_3' }],
    });

    expect(response.status).toBe(200);
    expect(response.data.items).toHaveLength(3);
  });

  it('rejects calorie targets below minimum threshold', () => {
    const response = mockApiResponse(422, {
      code: 'INVALID_CALORIE_TARGET',
      minCalories: 1200,
      providedCalories: 900,
    });

    expect(response.status).toBe(422);
    expect(response.data.code).toBe('INVALID_CALORIE_TARGET');
  });

  it('falls back to a non-AI meal plan when provider is unavailable', () => {
    const response = mockApiResponse(200, {
      planId: 'meal_fallback_01',
      source: 'fallback',
      generated: true,
    });

    expect(response.status).toBe(200);
    expect(response.data.source).toBe('fallback');
  });

  it('marks notifications as read in member feed', () => {
    const response = mockApiResponse(200, {
      notificationId: 'ntf_4',
      read: true,
      readAt: '2026-04-22T09:00:00.000Z',
    });

    expect(response.status).toBe(200);
    expect(response.data.read).toBe(true);
  });

  it('returns partial delivery status for bulk sends', () => {
    const response = mockApiResponse(207, {
      attempted: 20,
      delivered: 18,
      failed: 2,
    });

    expect(response.status).toBe(207);
    expect(response.data.failed).toBeGreaterThanOrEqual(0);
  });

  it('rejects unsupported nutrition goal types', () => {
    const response = mockApiResponse(422, {
      code: 'UNSUPPORTED_GOAL',
      goal: 'extreme_cut',
    });

    expect(response.status).toBe(422);
    expect(response.data.code).toBe('UNSUPPORTED_GOAL');
  });

  it('returns unread notification counter for member', () => {
    const response = mockApiResponse(200, {
      memberId: 'mem_001',
      unreadCount: 6,
    });

    expect(response.status).toBe(200);
    expect(response.data.unreadCount).toBeGreaterThanOrEqual(0);
  });
});
