import { NextResponse } from 'next/server';
import { authOptions } from '@/backend/shared/auth-options';

export async function GET() {
  return NextResponse.json({ 
    message: "Auth options imported successfully",
    secretSet: !!authOptions.secret
  });
}
