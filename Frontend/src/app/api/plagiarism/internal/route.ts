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
  if (!courseId || !courseWorkId)
    return send({ error: 'Missing courseId or courseWorkId' }, 400);

  try {
    // Step 1: Fetch all submissions
    const subRes = await fetch(
      `http://localhost:3000/api/classroom/submissions?courseId=${courseId}&courseWorkId=${courseWorkId}`,
      {
        headers: { Cookie: req.headers.get('cookie') || '' },
      }
    );
    const { studentSubmissions } = await subRes.json();

    const extracted = [];

    for (const submission of studentSubmissions) {
      const fileId =
        submission.assignmentSubmission?.attachments?.[0]?.driveFile?.id;

      if (!fileId) continue;

      try {
        const extractRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/drive/extract-text?fileId=${fileId}`,
          {
            headers: { Cookie: req.headers.get('cookie') || '' },
          }
        );
        const { text } = await extractRes.json();

        extracted.push({
          userId: submission.userId,
          fileId,
          text,
        });
      } catch (err) {
        console.error(`Failed to extract file ${fileId}:`, err);
      }
    }

    return send({ extracted });
  } catch (err: any) {
    console.error('[internal-plagiarism] error', err);
    return send({ error: err.message }, 500);
  }
}
