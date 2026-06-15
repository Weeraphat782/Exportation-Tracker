import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { requireStaffApiUser } from '@/lib/api-auth';
import { downloadSubmissionFileBytes } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function uniqueZipName(name: string, used: Set<string>): string {
  let candidate = name;
  let counter = 1;
  while (used.has(candidate)) {
    const dot = name.lastIndexOf('.');
    if (dot > 0) {
      candidate = `${name.slice(0, dot)}_${counter}${name.slice(dot)}`;
    } else {
      candidate = `${name}_${counter}`;
    }
    counter += 1;
  }
  used.add(candidate);
  return candidate;
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaffApiUser(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No document IDs provided.' }, { status: 400 });
    }

    const { data: submissions, error } = await auth.supabase
      .from('document_submissions')
      .select('id, original_file_name, file_name, file_path, file_url, storage_provider')
      .in('id', ids);

    if (error) {
      console.error('[download-zip] Failed to load submissions:', error);
      return NextResponse.json({ error: 'Could not load documents.' }, { status: 500 });
    }

    if (!submissions?.length) {
      return NextResponse.json({ error: 'No documents found.' }, { status: 404 });
    }

    const zip = new JSZip();
    const usedNames = new Set<string>();
    let added = 0;
    const failures: string[] = [];

    for (const doc of submissions) {
      const baseName =
        doc.original_file_name ||
        doc.file_name ||
        `document_${String(doc.id).slice(0, 8)}`;
      const fileName = uniqueZipName(baseName, usedNames);

      try {
        const bytes = await downloadSubmissionFileBytes({
          file_path: doc.file_path,
          file_url: doc.file_url,
          storage_provider: doc.storage_provider || 'r2',
        });
        if (!bytes.length) {
          throw new Error('Empty file');
        }
        zip.file(fileName, bytes);
        added += 1;
      } catch (err) {
        console.error(`[download-zip] Failed to add ${baseName}:`, err);
        failures.push(baseName);
      }
    }

    if (added === 0) {
      return NextResponse.json(
        { error: 'Could not download any of the selected files.' },
        { status: 502 }
      );
    }

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = `documents_${Date.now()}.zip`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
    };
    if (failures.length > 0) {
      headers['X-Zip-Warnings'] = `${added} added, ${failures.length} failed`;
    }

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    console.error('[download-zip] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create ZIP file.' }, { status: 500 });
  }
}
