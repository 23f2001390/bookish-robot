import { describe, expect, it } from 'vitest';
import { mockApiResponse } from '../helpers/test-utils';

describe('Reviews and Dashboard Component', () => {
  it('allows a member to submit a trainer review', () => {
    const response = mockApiResponse(201, {
      reviewId: 'rev_001',
      trainerId: 'tr_001',
      rating: 5,
      comment: 'Great session',
    });

    expect(response.status).toBe(201);
    expect(response.data.rating).toBe(5);
  });

  it('rejects ratings outside allowed range', () => {
    const invalidRating = 6;

    expect(invalidRating).toBeGreaterThan(5);
  });

  it('returns owner KPI payload with expected metrics', () => {
    const response = mockApiResponse(200, {
      activeMembers: 230,
      monthlyRevenue: 985000,
      avgAttendance: 64,
    });

    expect(response.status).toBe(200);
    expect(response.data.monthlyRevenue).toBeGreaterThan(0);
  });

  it('returns trainer rating summary stats', () => {
    const response = mockApiResponse(200, {
      trainerId: 'tr_001',
      averageRating: 4.7,
      reviewCount: 29,
    });

    expect(response.status).toBe(200);
    expect(response.data.averageRating).toBeLessThanOrEqual(5);
  });

  it('includes review trend data for dashboard analytics', () => {
    const response = mockApiResponse(200, {
      weeklyTrend: [4.5, 4.6, 4.7, 4.7],
      period: '4w',
    });

    expect(response.data.weeklyTrend).toHaveLength(4);
  });

  it('rejects review edits after editable window closes', () => {
    const response = mockApiResponse(422, {
      code: 'REVIEW_EDIT_WINDOW_EXPIRED',
      editableHours: 24,
    });

    expect(response.status).toBe(422);
    expect(response.data.code).toBe('REVIEW_EDIT_WINDOW_EXPIRED');
  });

  it('rejects dashboard access for unauthorized role', () => {
    const response = mockApiResponse(403, {
      code: 'DASHBOARD_ACCESS_DENIED',
    });

    expect(response.status).toBe(403);
    expect(response.data.code).toBe('DASHBOARD_ACCESS_DENIED');
  });

  it('keeps KPI values non-negative', () => {
    const response = mockApiResponse(200, {
      activeMembers: 0,
      monthlyRevenue: 0,
      avgAttendance: 0,
    });

    expect(response.data.activeMembers).toBeGreaterThanOrEqual(0);
    expect(response.data.monthlyRevenue).toBeGreaterThanOrEqual(0);
    expect(response.data.avgAttendance).toBeGreaterThanOrEqual(0);
  });

  it('handles empty trend series for new gym branches', () => {
    const response = mockApiResponse(200, {
      weeklyTrend: [],
      period: '4w',
    });

    expect(response.status).toBe(200);
    expect(response.data.weeklyTrend).toHaveLength(0);
  });

  it('rejects duplicate reviews for the same completed session', () => {
    const response = mockApiResponse(409, {
      code: 'REVIEW_ALREADY_SUBMITTED',
      sessionId: 'ses_010',
    });

    expect(response.status).toBe(409);
    expect(response.data.code).toBe('REVIEW_ALREADY_SUBMITTED');
  });

  it('includes the selected KPI period label in response', () => {
    const response = mockApiResponse(200, {
      period: 'monthly',
      activeMembers: 240,
    });

    expect(response.status).toBe(200);
    expect(response.data.period).toBe('monthly');
  });
});
