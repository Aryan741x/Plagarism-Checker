import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); //{language,documents}
    // console.log('[flask-compare] Received body:', body);
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    const flaskRes = await fetch(`${BASE_URL}/internal-plagiarism`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await flaskRes.json();

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[flask-compare] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
