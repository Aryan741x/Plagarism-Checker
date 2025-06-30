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

  const allSubmissions: any[] = [];
  let pageToken: string | undefined = undefined;

  try {
    do {
      const url = new URL(
        `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`
      );
      url.searchParams.set('pageSize', '100');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Google API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (Array.isArray(data.studentSubmissions)) {
        allSubmissions.push(...data.studentSubmissions);
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    console.log('Fetched', allSubmissions.length, 'submissions');
    return NextResponse.json({ studentSubmissions: allSubmissions });
  } catch (err: any) {
    console.error('Google API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
