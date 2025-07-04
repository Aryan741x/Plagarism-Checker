import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const courseId = req.nextUrl.searchParams.get('courseId');
  const endpoint = courseId
    ? `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`
    : 'https://classroom.googleapis.com/v1/courses';

  const result = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });

  if (!result.ok) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  const data = await result.json();
  return NextResponse.json(data);
}
