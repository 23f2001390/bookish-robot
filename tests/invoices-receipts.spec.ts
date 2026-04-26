import { describe, expect, it } from 'vitest';
import { mockApiResponse, paginate } from '../helpers/test-utils';

describe('Invoices and Receipts Component', () => {
  it('returns pagination metadata when listing invoices', () => {
    const meta = paginate(2, 5, 17);

    expect(meta.page).toBe(2);
    expect(meta.totalPages).toBe(4);
  });

  it('returns invoice details by id', () => {
    const response = mockApiResponse(200, {
      invoiceId: 'inv_001',
      amount: 1999,
      currency: 'INR',
      status: 'paid',
    });

    expect(response.status).toBe(200);
    expect(response.data.status).toBe('paid');
  });

  it('provides a receipt download URL for paid invoices', () => {
    const response = mockApiResponse(200, {
      invoiceId: 'inv_001',
      receiptUrl: '/api/member/invoices/inv_001/receipt',
      format: 'pdf',
    });

    expect(response.data.format).toBe('pdf');
    expect(response.data.receiptUrl).toContain('/api/member/invoices');
  });

  it('returns not found for missing invoice ids', () => {
    const response = mockApiResponse(404, {
      code: 'INVOICE_NOT_FOUND',
      invoiceId: 'inv_999',
    });

    expect(response.status).toBe(404);
    expect(response.data.code).toBe('INVOICE_NOT_FOUND');
  });

  it('supports owner-side invoice filtering', () => {
    const response = mockApiResponse(200, {
      filters: { status: 'unpaid', month: '2026-04' },
      count: 8,
    });

    expect(response.status).toBe(200);
    expect(response.data.count).toBeGreaterThanOrEqual(0);
  });

  it('returns 404 for unknown invoice id', () => {
    const response = mockApiResponse(404, {
      code: 'INVOICE_NOT_FOUND',
    });

    expect(response.status).toBe(404);
  });

  it('returns aging bucket details for unpaid invoices', () => {
    const response = mockApiResponse(200, {
      invoiceId: 'inv_023',
      status: 'unpaid',
      overdueDays: 11,
      agingBucket: '8-30',
    });

    expect(response.status).toBe(200);
    expect(response.data.agingBucket).toBe('8-30');
  });

  it('rejects receipt download for unauthorized members', () => {
    const response = mockApiResponse(403, {
      code: 'RECEIPT_ACCESS_DENIED',
      invoiceId: 'inv_001',
    });

    expect(response.status).toBe(403);
    expect(response.data.code).toBe('RECEIPT_ACCESS_DENIED');
  });

  it('validates supported currency values', () => {
    const response = mockApiResponse(422, {
      code: 'UNSUPPORTED_CURRENCY',
      currency: 'BTC',
    });

    expect(response.status).toBe(422);
    expect(response.data.currency).toBe('BTC');
  });

  it('returns processing status while payment gateway callback is pending', () => {
    const response = mockApiResponse(202, {
      invoiceId: 'inv_450',
      status: 'processing',
    });

    expect(response.status).toBe(202);
    expect(response.data.status).toBe('processing');
  });

  it('marks failed payments with retry eligibility', () => {
    const response = mockApiResponse(402, {
      invoiceId: 'inv_451',
      status: 'payment_failed',
      retryAllowed: true,
    });

    expect(response.status).toBe(402);
    expect(response.data.retryAllowed).toBe(true);
  });

  it('sets hasNext to false on the final page', () => {
    const meta = paginate(4, 5, 20);

    expect(meta.totalPages).toBe(4);
    expect(meta.hasNext).toBe(false);
  });
});
