// src/app/api/drive/extract-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  /* 1. Auth */
  const token = await getToken({ req });
  const accessToken = token?.accessToken;
  const userEmail   = (token as any)?.email || 'unknown';

  if (!accessToken) {
    return NextResponse.json(
      { stage: 'auth', ok: false, message: 'No access token' },
      { status: 401 }
    );
  }

  /* 2. Param */
  const fileId = req.nextUrl.searchParams.get('fileId');
  if (!fileId) {
    return NextResponse.json(
      { stage: 'param', ok: false, message: 'fileId missing' },
      { status: 400 }
    );
  }

  /* 3. Ping Drive metadata to see what Drive says */
  const metaUrl =
    `https://www.googleapis.com/drive/v3/files/${fileId}` +
    '?fields=name,mimeType&supportsAllDrives=true';

  const metaRes  = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const metaBody = await metaRes.text();        // always read the body

  /* 4. Return *everything* so you can inspect it */
  return NextResponse.json({
    ok: metaRes.ok,
    status: metaRes.status,        // 404, 403, etc.
    stage: 'google-drive-metadata',
    fileId,
    requestedBy: userEmail,
    metaUrl,
    driveResponseBody: metaBody,   // Google’s own JSON error or metadata
    hint: metaRes.ok
      ? 'Drive found the file. Full extraction logic is safe to run.'
      : 'Drive did NOT find the file. Check fileId, sharing, or supportsAllDrives.',
  });
}
