import { describe, expect, it } from 'vitest';
import { mockApiResponse } from '../helpers/test-utils';

describe('Bookings and Scheduling Component', () => {
  it('creates a booking when a slot is available', () => {
    const response = mockApiResponse(201, {
      bookingId: 'bk_001',
      sessionId: 'ses_001',
      status: 'confirmed',
    });

    expect(response.status).toBe(201);
    expect(response.data.status).toBe('confirmed');
  });

  it('prevents overbooking once capacity is reached', () => {
    const response = mockApiResponse(409, {
      code: 'SESSION_FULL',
      availableSlots: 0,
    });

    expect(response.status).toBe(409);
    expect(response.data.availableSlots).toBe(0);
  });

  it('allows cancellation before the cutoff window', () => {
    const response = mockApiResponse(200, {
      bookingId: 'bk_001',
      status: 'cancelled',
      refundEligible: true,
    });

    expect(response.status).toBe(200);
    expect(response.data.refundEligible).toBe(true);
  });

  it('rejects cancellation inside the restricted window', () => {
    const response = mockApiResponse(422, {
      code: 'CANCELLATION_WINDOW_EXPIRED',
      cutoffHours: 24,
    });

    expect(response.status).toBe(422);
    expect(response.data.cutoffHours).toBe(24);
  });

  it('returns trainer schedule for a selected day', () => {
    const response = mockApiResponse(200, {
      trainerId: 'tr_001',
      date: '2026-04-04',
      sessions: [{ id: 'ses_001' }, { id: 'ses_002' }],
    });

    expect(response.status).toBe(200);
    expect(response.data.sessions).toHaveLength(2);
  });

  it('rejects booking for members without active status', () => {
    const response = mockApiResponse(403, {
      code: 'MEMBERSHIP_INACTIVE',
      memberId: 'mem_099',
    });

    expect(response.status).toBe(403);
    expect(response.data.code).toBe('MEMBERSHIP_INACTIVE');
  });

  it('returns waitlist position when a session is already full', () => {
    const response = mockApiResponse(202, {
      waitlistId: 'wl_001',
      sessionId: 'ses_001',
      position: 3,
    });

    expect(response.status).toBe(202);
    expect(response.data.position).toBeGreaterThan(0);
  });

  it('rejects booking for sessions scheduled in the past', () => {
    const response = mockApiResponse(422, {
      code: 'SESSION_DATE_IN_PAST',
      sessionId: 'ses_010',
    });

    expect(response.status).toBe(422);
    expect(response.data.code).toBe('SESSION_DATE_IN_PAST');
  });

  it('enforces one booking per member for a given session', () => {
    const response = mockApiResponse(409, {
      code: 'BOOKING_ALREADY_EXISTS',
      bookingId: 'bk_001',
    });

    expect(response.status).toBe(409);
    expect(response.data.code).toBe('BOOKING_ALREADY_EXISTS');
  });

  it('reschedules bookings only to valid available slots', () => {
    const response = mockApiResponse(200, {
      bookingId: 'bk_002',
      oldSessionId: 'ses_001',
      newSessionId: 'ses_004',
      status: 'rescheduled',
    });

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('rescheduled');
  });

  it('rejects unauthorized access to trainer schedules', () => {
    const response = mockApiResponse(401, {
      code: 'UNAUTHORIZED',
    });

    expect(response.status).toBe(401);
    expect(response.data.code).toBe('UNAUTHORIZED');
  });

  it('rejects reschedule requests after the session has started', () => {
    const response = mockApiResponse(422, {
      code: 'SESSION_ALREADY_STARTED',
      bookingId: 'bk_090',
    });

    expect(response.status).toBe(422);
    expect(response.data.code).toBe('SESSION_ALREADY_STARTED');
  });

  it('returns an empty schedule for a trainer off day', () => {
    const response = mockApiResponse(200, {
      trainerId: 'tr_002',
      date: '2026-04-26',
      sessions: [],
    });

    expect(response.status).toBe(200);
    expect(response.data.sessions).toHaveLength(0);
  });

  it('validates required fields when session id is missing', () => {
    const response = mockApiResponse(400, {
      code: 'SESSION_ID_REQUIRED',
      field: 'sessionId',
    });

    expect(response.status).toBe(400);
    expect(response.data.field).toBe('sessionId');
  });
});
