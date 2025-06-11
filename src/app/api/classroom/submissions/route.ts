import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get('courseId');
  const courseWorkId = req.nextUrl.searchParams.get('courseWorkId');

  console.log('Fetching submissions for:', courseId, courseWorkId);

  if (!courseId || !courseWorkId) {
    return NextResponse.json(
      { error: 'Missing courseId or courseWorkId' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
    );

    const data = await res.json();
    console.log('Submissions data:', data);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Google API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
