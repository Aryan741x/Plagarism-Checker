import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); //{language,documents}
    // console.log('[flask-compare] Received body:', body);
    const flaskRes = await fetch('http://localhost:5000/internal-plagiarism', {
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
