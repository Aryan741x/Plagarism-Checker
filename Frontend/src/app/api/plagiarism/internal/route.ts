import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const send = (data: any, status = 200) =>
  NextResponse.json(data, { status });

function fileMatchesLang(fileId:string,lang:string){
  if(lang=='python')return fileId.endsWith('.py');
  // Add more language checks as needed
  return true;
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.accessToken) return send({ error: 'Unauthorized' }, 401);

  const courseId = req.nextUrl.searchParams.get('courseId');
  const courseWorkId = req.nextUrl.searchParams.get('courseWorkId');
  const lang = req.nextUrl.searchParams.get('lang') ?? 'text';
  if (!courseId || !courseWorkId)
    return send({ error: 'Missing courseId or courseWorkId' }, 400);

  try {
    // Step 1: Fetch all submissions
    const subRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}` +
      `/api/classroom/submissions?courseId=${courseId}&courseWorkId=${courseWorkId}`,
      { headers: { Cookie: req.headers.get('cookie') ?? '' } }
    );
    const { studentSubmissions } = await subRes.json();

    const extracted = [];
    const invalidIds:string[]=[];

    for (const submission of studentSubmissions) {
      const fileId =
        submission.assignmentSubmission?.attachments?.[0]?.driveFile?.id;

      if (!fileId) continue;
      if(!fileMatchesLang(fileId,lang)){
        invalidIds.push(fileId);
        continue;
      }

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
          fileName: submission.assignmentSubmission?.attachments?.[0]?.driveFile?.title || fileId,
        });
      } catch (err) {
        console.error(`Failed to extract file ${fileId}:`, err);
      }
    }

    return send({ extracted,invalid: invalidIds });
  } catch (err: any) {
    console.error('[internal-plagiarism] error', err);
    return send({ error: err.message }, 500);
  }
}
