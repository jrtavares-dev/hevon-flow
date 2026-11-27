import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
const ALLOWED_VIDEO_EXTS = ['mp4', 'webm', 'mov', 'm4v'];

export async function POST(request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderType = formData.get('type') || 'presells'; // 'presells' | 'images' | 'videos'

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const originalName = file.name || 'upload';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    let subDir = 'presells';
    if (folderType === 'videos') {
      subDir = 'videos';
      if (!ALLOWED_VIDEO_EXTS.includes(ext)) {
        return NextResponse.json(
          { success: false, message: `Formato de vídeo inválido (.${ext}). Permitidos: ${ALLOWED_VIDEO_EXTS.join(', ')}` },
          { status: 400 }
        );
      }
    } else if (folderType === 'images') {
      subDir = 'images';
      if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
        return NextResponse.json(
          { success: false, message: `Formato de imagem inválido (.${ext}). Permitidos: ${ALLOWED_IMAGE_EXTS.join(', ')}` },
          { status: 400 }
        );
      }
    } else {
      subDir = 'presells';
      if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
        return NextResponse.json(
          { success: false, message: `Formato de imagem inválido (.${ext}). Permitidos: ${ALLOWED_IMAGE_EXTS.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    await fs.mkdir(uploadDir, { recursive: true });

    const prefix = subDir === 'videos' ? 'video_' : subDir === 'images' ? 'img_' : 'presell_';
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const filename = `${prefix}${uniqueSuffix}.${ext}`;
    const targetPath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(targetPath, buffer);

    // Also mirror into process.cwd()/uploads in case OpenLiteSpeed or standalone serves from root
    try {
      const rootUploadDir = path.join(process.cwd(), 'uploads', subDir);
      await fs.mkdir(rootUploadDir, { recursive: true });
      await fs.writeFile(path.join(rootUploadDir, filename), buffer);
    } catch {
      // ignore
    }

    const publicUrl = `/uploads/${subDir}/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'Upload realizado com sucesso!',
      url: publicUrl,
      filename,
      size: buffer.length,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno ao salvar arquivo.' },
      { status: 500 }
    );
  }
}
