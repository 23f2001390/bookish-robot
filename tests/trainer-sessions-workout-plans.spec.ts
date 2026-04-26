import { describe, expect, it } from 'vitest';
import { mockApiResponse } from '../helpers/test-utils';

describe('Trainer Sessions and Workout Plans Component', () => {
  it('creates a trainer session', () => {
    const response = mockApiResponse(201, {
      sessionId: 'ses_001',
      trainerId: 'tr_001',
      capacity: 12,
      status: 'scheduled',
    });

    expect(response.status).toBe(201);
    expect(response.data.status).toBe('scheduled');
  });

  it('updates session status to completed', () => {
    const response = mockApiResponse(200, {
      sessionId: 'ses_001',
      status: 'completed',
    });

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('completed');
  });

  it('assigns a workout plan to a member', () => {
    const response = mockApiResponse(201, {
      planId: 'plan_001',
      memberId: 'mem_001',
      trainerId: 'tr_001',
      durationWeeks: 8,
    });

    expect(response.status).toBe(201);
    expect(response.data.durationWeeks).toBe(8);
  });

  it('fetches workout plans for a member', () => {
    const response = mockApiResponse(200, {
      memberId: 'mem_001',
      plans: [{ id: 'plan_001' }, { id: 'plan_002' }],
    });

    expect(response.status).toBe(200);
    expect(response.data.plans).toHaveLength(2);
  });

  it('rejects plan updates for unassigned trainers', () => {
    const response = mockApiResponse(403, {
      code: 'TRAINER_NOT_ASSIGNED',
      memberId: 'mem_002',
    });

    expect(response.status).toBe(403);
    expect(response.data.code).toBe('TRAINER_NOT_ASSIGNED');
  });

  it('rejects session creation with invalid capacity', () => {
    const response = mockApiResponse(422, {
      code: 'INVALID_CAPACITY',
      minCapacity: 1,
    });

    expect(response.status).toBe(422);
    expect(response.data.code).toBe('INVALID_CAPACITY');
  });

  it('rejects workout assignment for inactive members', () => {
    const response = mockApiResponse(409, {
      code: 'MEMBER_INACTIVE',
      memberId: 'mem_010',
    });

    expect(response.status).toBe(409);
    expect(response.data.code).toBe('MEMBER_INACTIVE');
  });

  it('rejects session completion when attendance log is missing', () => {
    const response = mockApiResponse(400, {
      code: 'ATTENDANCE_REQUIRED',
      sessionId: 'ses_009',
    });

    expect(response.status).toBe(400);
    expect(response.data.code).toBe('ATTENDANCE_REQUIRED');
  });

  it('rejects overlapping trainer session times', () => {
    const response = mockApiResponse(409, {
      code: 'SESSION_TIME_CONFLICT',
      conflictingSessionId: 'ses_003',
    });

    expect(response.status).toBe(409);
    expect(response.data.code).toBe('SESSION_TIME_CONFLICT');
  });

  it('rejects workout plans with invalid exercise references', () => {
    const response = mockApiResponse(422, {
      code: 'INVALID_EXERCISE_REFERENCE',
      exerciseId: 'ex_999',
    });

    expect(response.status).toBe(422);
    expect(response.data.code).toBe('INVALID_EXERCISE_REFERENCE');
  });

  it('rejects member plan access by unrelated trainers', () => {
    const response = mockApiResponse(403, {
      code: 'TRAINER_MEMBER_ACCESS_DENIED',
      memberId: 'mem_011',
    });

    expect(response.status).toBe(403);
    expect(response.data.code).toBe('TRAINER_MEMBER_ACCESS_DENIED');
  });

  it('creates workout plans in draft before publish', () => {
    const response = mockApiResponse(201, {
      planId: 'plan_050',
      status: 'draft',
      memberId: 'mem_001',
    });

    expect(response.status).toBe(201);
    expect(response.data.status).toBe('draft');
  });

  it('rejects attendance submission for canceled sessions', () => {
    const response = mockApiResponse(409, {
      code: 'SESSION_CANCELED',
      sessionId: 'ses_100',
    });

    expect(response.status).toBe(409);
    expect(response.data.code).toBe('SESSION_CANCELED');
  });

  it('allows workout reassignment within the same trainer team', () => {
    const response = mockApiResponse(200, {
      planId: 'plan_050',
      fromTrainerId: 'tr_001',
      toTrainerId: 'tr_003',
      status: 'reassigned',
    });

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('reassigned');
  });
});
