import { NextResponse,NextRequest } from "next/server";
export async function POST(request: NextRequest) {
  try{
    const {documents} = await request.json();
    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const flaskRes = await fetch('http://localhost:5000/detect-ai/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents }),
    });
    if (!flaskRes.ok) {
      return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
    }
    const data = await flaskRes.json();
    return NextResponse.json(data, { status: 200 });
  }catch (error) {
    console.error('Error in AI detection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}