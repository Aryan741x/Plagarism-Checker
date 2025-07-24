import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';
import mammoth from 'mammoth';
import { fileTypeFromBuffer } from 'file-type';
import PDFParser from 'pdf2json';     
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const send = (d: any, s = 200) => NextResponse.json(d, { status: s });

/* -------- Drive download / export helper ---------------- */
async function download(
  fileId: string,
  token: string
): Promise<{ buf: Buffer; name: string; mime: string }> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });
  const drive = google.drive({ version: 'v3', auth });

  const meta = await drive.files.get({
    fileId,
    fields: 'name,mimeType',
    supportsAllDrives: true,
  });
  const { name, mimeType } = meta.data;

  if (mimeType?.startsWith('application/vnd.google-apps.')) {
    const exp = await drive.files.export(
      { fileId, mimeType: 'text/plain' },
      { responseType: 'arraybuffer' }
    );
    return { buf: Buffer.from(exp.data as ArrayBuffer), name: name!, mime: 'text/plain' };
  }

  const dl = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' }
  );
  return { buf: Buffer.from(dl.data as ArrayBuffer), name: name!, mime: mimeType! };
}

/* -------------------- Route ----------------------------- */
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.accessToken) return send({ error: 'unauthorized' }, 401);

  const fileId = req.nextUrl.searchParams.get('fileId');
  if (!fileId) return send({ error: 'fileId missing' }, 400);

  try {
    const { buf, name, mime } = await download(fileId, token.accessToken as string);
    const sniff = await fileTypeFromBuffer(buf);
    const realMime = sniff?.mime || mime;

    let text = '';

    /* ---------- PDF via pdf2json(Y-row) ---------------- */
    if (realMime === 'application/pdf') {
      text = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', e => reject(e.parserError));

        pdfParser.on('pdfParser_dataReady', (pdf: any) => {
          const pagesText: string[] = [];

          for (const page of pdf.Pages) {
            // 1) bucket words by rounded Y
            const rows: Record<number, { x: number; str: string }[]> = {};
            for (const t of page.Texts) {
              const y = Math.round(t.y);          // line row
              const x = t.x;                      // left position
              const str = decodeURIComponent(t.R.map((r: any) => r.T).join(''));
              (rows[y] ??= []).push({ x, str });
            }

            // 2) turn rows into one line each
            const lines = Object.entries(rows)
              .sort(([y1], [y2]) => Number(y1) - Number(y2))       // top-to-bottom
              .map(([, words]) =>
                words
                  .sort((a, b) => a.x - b.x)                       // left-to-right
                  .map(w => w.str)
                  .join(' ')
              )
              .join('\n');

            pagesText.push(lines);
          }

          resolve(pagesText.join('\n').trim());
        });

        pdfParser.parseBuffer(buf);
      });
    }
    /* ------------ DOCX ---------------------------- */
    else if (
      realMime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = (await mammoth.extractRawText({ buffer: buf })).value.trim();
    }
    /* ------------ Plain-text ---------------------- */
    else if (realMime.startsWith('text/')) {
      text = buf.toString('utf-8').trim();
    }
    /* ------------ Unsupported --------------------- */
    else {
      return send({ error: `unsupported mime ${realMime}` }, 415);
    }

    return send({
      fileName: name,
      mimeType: realMime,
      text: text || '(no selectable text)',
    });
  } catch (err: any) {
    console.error('[extract-text]', err);
    const status = err.code === 404 || err.code === 403 ? err.code : 500;
    return send({ error: err.message }, status);
  }
}
