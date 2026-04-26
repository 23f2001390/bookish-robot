import { NextResponse, NextRequest } from 'next/server'
import { authenticate } from '@/backend/middleware/auth-middleware'
import { prisma } from '@/backend/shared/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(['MEMBER', 'OWNER'])
  if (auth.error) return auth.error
  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: {
      id: true,
      memberId: true,
      plan: true,
      amount: true,
      date: true,
      status: true,
      member: {
        include: { user: { select: { name: true, email: true } } }
      },
    }
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  // If the requester is a member, ensure it's their own invoice
  if (auth.user.role === 'MEMBER' && invoice.memberId !== auth.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const memberName = invoice.member?.user?.name || 'Member'
  const memberEmail = invoice.member?.user?.email || ''
  const invoiceDate = new Date(invoice.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const invoiceNo = invoice.id.slice(0, 8).toUpperCase()

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice #${invoiceNo} — SoulRep Gym</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #111; padding: 40px; max-width: 800px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #111; padding-bottom: 24px; margin-bottom: 32px; }
    .gym-name { font-size: 36px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
    .gym-sub { font-size: 11px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #666; margin-top: 4px; }
    .invoice-label { text-align: right; }
    .invoice-label h2 { font-size: 14px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; color: #666; }
    .invoice-label .inv-no { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
    .meta-block label { font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px; }
    .meta-block p { font-size: 15px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead tr { background: #111; color: #fff; }
    thead th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; }
    tbody tr { border-bottom: 1px solid #eee; }
    tbody td { padding: 16px; font-size: 14px; }
    .amount-row { font-weight: 700; }
    .total-section { display: flex; justify-content: flex-end; }
    .total-box { border: 3px solid #111; padding: 16px 24px; min-width: 220px; }
    .total-box .total-label { font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #666; }
    .total-box .total-amount { font-size: 32px; font-weight: 900; letter-spacing: -1px; }
    .status-badge { display: inline-block; padding: 2px 10px; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; border: 2px solid; }
    .status-PAID { color: #16a34a; border-color: #16a34a; background: #f0fdf4; }
    .status-PENDING { color: #ca8a04; border-color: #ca8a04; background: #fefce8; }
    .status-OVERDUE { color: #dc2626; border-color: #dc2626; background: #fef2f2; }
    .footer { margin-top: 48px; border-top: 2px solid #eee; padding-top: 24px; font-size: 11px; color: #888; text-align: center; font-weight: 600; letter-spacing: 1px; }
    .controls { background: #f4f4f5; padding: 12px; display: flex; justify-content: center; gap: 12px; margin-bottom: 20px; border-radius: 8px; }
    .btn { padding: 8px 16px; font-size: 12px; font-weight: 900; border: none; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
    .btn-primary { background: #111; color: #fff; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body onload="window.print()">
  <div class="controls no-print">
    <button class="btn btn-primary" onclick="window.print()">⬇ Save as PDF</button>
    <button class="btn" onclick="window.close()" style="background:#ddd">Close</button>
  </div>
  
  <div class="header">
    <div>
      <div class="gym-name">SoulRep</div>
      <div class="gym-sub">Gym & Fitness Center</div>
    </div>
    <div class="invoice-label">
      <h2>Invoice</h2>
      <div class="inv-no">#${invoiceNo}</div>
    </div>
  </div>

  <div class="meta">
    <div>
      <div class="meta-block">
        <label>Billed To</label>
        <p>${memberName}</p>
        <p style="font-size:13px;color:#555;font-weight:400;">${memberEmail}</p>
      </div>
    </div>
    <div>
      <div class="meta-block" style="margin-bottom:12px">
        <label>Invoice Date</label>
        <p>${invoiceDate}</p>
      </div>
      <div class="meta-block">
        <label>Status</label>
        <span class="status-badge status-${invoice.status}">${invoice.status}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Plan</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr class="amount-row">
        <td>Gym Membership Subscription</td>
        <td>${invoice.plan.charAt(0) + invoice.plan.slice(1).toLowerCase()} Plan</td>
        <td style="text-align:right">₹${invoice.amount}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-box">
      <div class="total-label">Total Due</div>
      <div class="total-amount">₹${invoice.amount}</div>
    </div>
  </div>

  <div class="footer">
    Thank you for being a SoulRep member! &nbsp;·&nbsp; This is a computer-generated invoice.
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
}
