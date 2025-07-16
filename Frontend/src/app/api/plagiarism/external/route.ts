import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const send = (data: any, status = 200) =>
  NextResponse.json(data, { status });

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.accessToken) return send({ error: 'Unauthorized' }, 401);

  const courseId = req.nextUrl.searchParams.get('courseId');
  const courseWorkId = req.nextUrl.searchParams.get('courseWorkId');
  if (!courseId || !courseWorkId) {
    return send({ error: 'Missing courseId or courseWorkId' }, 400);
  }

  try {
    const subRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/classroom/submissions?courseId=${courseId}&courseWorkId=${courseWorkId}`,
      {
        headers: {
          Cookie: req.headers.get('cookie') ?? '',
        },
      }
    );

    const { studentSubmissions } = await subRes.json();
    const extracted = [];

    for (const submission of studentSubmissions) {
      const fileId = submission.assignmentSubmission?.attachments?.[0]?.driveFile?.id;
      if (!fileId) continue;

      try {
        const extractRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/drive/extract-text?fileId=${fileId}`,
          {
            headers: {
              Cookie: req.headers.get('cookie') ?? '',
            },
          }
        );

        const { text } = await extractRes.json();

        extracted.push({
          userId: submission.userId,
          fileId,
          fileName: submission.assignmentSubmission?.attachments?.[0]?.driveFile?.title || fileId,
          text,
        });
      } catch (err) {
        console.error(`Failed to extract file ${fileId}:`, err);
      }
    }

    return send({ extracted });
  } catch (err: any) {
    console.error('[external-plagiarism] error', err);
    return send({ error: err.message }, 500);
  }
}

// Example POST handler for plagiarism checking via external API
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.accessToken) return send({ error: 'Unauthorized' }, 401);

  try {
    const body = await req.json();
    // Example: body should contain { text: string }
    const { text } = body;
    if (!text) return send({ error: 'Missing text for plagiarism check' }, 400);

    // Call your external plagiarism API here
    const plagRes = await fetch(`${process.env.NEXT_PUBLIC_PLAGIARISM_API_URL}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.accessToken}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!plagRes.ok) {
      const error = await plagRes.text();
      return send({ error: `Plagiarism API error: ${error}` }, plagRes.status);
    }

    const result = await plagRes.json();
    return send({ result });
  } catch (err: any) {
    console.error('[external-plagiarism][POST] error', err);
    return send({ error: err.message }, 500);
  }
}
