import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';

const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

// Pastas base permitidas para entrega pública de uploads
const ALLOWED_ROOTS = [
  path.resolve(process.cwd(), 'public', 'uploads'),
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(process.cwd(), '.next', 'standalone', 'public', 'uploads'),
];

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || !Array.isArray(pathSegments) || pathSegments.length === 0) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    // 1. Sanitização rigorosa contra Directory Traversal (SEC-05)
    const safeSegments = pathSegments.map((s) =>
      s.replace(/(\.\.[\/\\])/g, '').replace(/[^a-zA-Z0-9_\-\.]/g, '')
    );
    const relativeFilePath = path.join(...safeSegments);

    // 2. Localização assíncrona do arquivo físico
    let targetFile = null;
    let fileStats = null;

    for (const root of ALLOWED_ROOTS) {
      const candidatePath = path.resolve(root, relativeFilePath);
      // Validar matematicamente se o caminho resolvido está dentro de uma das pastas permitidas
      if (!candidatePath.startsWith(root)) {
        continue;
      }
      try {
        const stats = await fsPromises.stat(candidatePath);
        if (stats.isFile()) {
          targetFile = candidatePath;
          fileStats = stats;
          break;
        }
      } catch {
        // Arquivo não existe neste local, continua busca
      }
    }

    if (!targetFile || !fileStats) {
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }

    const ext = path.extname(targetFile).toLowerCase().replace('.', '');
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const etag = `"${fileStats.size.toString(16)}-${fileStats.mtimeMs.toString(16)}"`;

    // 3. Suporte a 304 Not Modified via ETag (Economia de tráfego)
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // 4. Suporte a Range Requests para vídeos (iOS, Safari e navegação de reprodução)
    const rangeHeader = request.headers.get('range');
    const fileSize = fileStats.size;

    if (rangeHeader && rangeHeader.startsWith('bytes=') && (ext === 'mp4' || ext === 'webm' || ext === 'mov')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse('Requested range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(targetFile, { start, end });

      return new Response(fileStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunksize),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': etag,
        },
      });
    }

    // 5. Leitura assíncrona não bloqueante (WEB-02)
    const fileBuffer = await fsPromises.readFile(targetFile);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'ETag': etag,
      },
    });
  } catch (err) {
    console.error('Error serving upload file:', err?.message || err);
    return new NextResponse('Erro ao carregar arquivo', { status: 500 });
  }
}
