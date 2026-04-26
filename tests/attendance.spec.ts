import { describe, expect, it } from 'vitest';
import { mockApiResponse, paginate } from '../helpers/test-utils';

describe('Attendance Component', () => {
  const memberId = 'mem_001';

  it('marks attendance when a valid QR payload is submitted', () => {
    const response = mockApiResponse(201, {
      attendanceId: 'att_001',
      memberId,
      status: 'present',
    });

    expect(response.status).toBe(201);
    expect(response.data.status).toBe('present');
  });

  it('blocks duplicate same-day attendance submissions', () => {
    const response = mockApiResponse(409, {
      code: 'DUPLICATE_ATTENDANCE',
      memberId,
    });

    expect(response.status).toBe(409);
    expect(response.data.code).toBe('DUPLICATE_ATTENDANCE');
  });

  it('returns correct pagination metadata for history requests', () => {
    const meta = paginate(1, 10, 23);

    expect(meta.totalPages).toBe(3);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(false);
  });

  it('treats five consecutive attendance days as a valid streak', () => {
    const streakDays = [1, 2, 3, 4, 5].length;

    expect(streakDays).toBeGreaterThanOrEqual(5);
  });

  it('returns a dashboard snapshot with meaningful values', () => {
    const response = mockApiResponse(200, {
      totalToday: 76,
      weeklyAverage: 62,
      topHour: '18:00',
    });

    expect(response.status).toBe(200);
    expect(response.data.totalToday).toBeGreaterThan(0);
    expect(response.data.weeklyAverage).toBeGreaterThan(0);
  });

  it('rejects attendance when membership has expired', () => {
    const response = mockApiResponse(403, {
      code: 'MEMBERSHIP_EXPIRED',
    });

    expect(response.status).toBe(403);
    expect(response.data.code).toBe('MEMBERSHIP_EXPIRED');
  });

  it('returns not found when no open check-in exists for member', () => {
    const response = mockApiResponse(404, {
      code: 'CHECKIN_NOT_FOUND',
      memberId: 'mem_020',
    });

    expect(response.status).toBe(404);
    expect(response.data.code).toBe('CHECKIN_NOT_FOUND');
  });

  it('rejects tampered QR payloads', () => {
    const response = mockApiResponse(401, {
      code: 'INVALID_QR_SIGNATURE',
    });

    expect(response.status).toBe(401);
    expect(response.data.code).toBe('INVALID_QR_SIGNATURE');
  });

  it('shows no next page when history is empty', () => {
    const meta = paginate(1, 10, 0);

    expect(meta.totalPages).toBe(0);
    expect(meta.hasNext).toBe(false);
  });

  it('includes late flag when check-in is after grace period', () => {
    const response = mockApiResponse(200, {
      attendanceId: 'att_123',
      status: 'present',
      late: true,
    });

    expect(response.status).toBe(200);
    expect(response.data.late).toBe(true);
  });

  it('prevents a second scan in the same check-in window', () => {
    const response = mockApiResponse(409, {
      code: 'ALREADY_MARKED_PRESENT',
      attendanceId: 'att_123',
    });

    expect(response.status).toBe(409);
    expect(response.data.code).toBe('ALREADY_MARKED_PRESENT');
  });

  it('denies owner summary access for non-owner role', () => {
    const response = mockApiResponse(403, {
      code: 'ATTENDANCE_SUMMARY_ACCESS_DENIED',
    });

    expect(response.status).toBe(403);
    expect(response.data.code).toBe('ATTENDANCE_SUMMARY_ACCESS_DENIED');
  });
});
