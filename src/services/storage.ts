import { supabase } from '../supabaseClient';

const STORAGE_BUCKET = 'course-images';
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadImageResult {
  success: boolean;
  publicUrl?: string;
  source?: 'supabase' | 'server';
  error?: string;
}

function sanitizeFileName(fileName: string): { base: string; ext: string } {
  const parts = fileName.split('.');
  const rawExt = parts.length > 1 ? parts.pop() || 'png' : 'png';
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const rawBase = parts.join('.') || 'imagen';
  const base =
    rawBase
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'imagen';
  return { base, ext };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo leer el archivo de imagen.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer la imagen seleccionada.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a local image file to Supabase Storage ('course-images' bucket)
 * or falls back seamlessly to the Express server /api/uploads/image endpoint.
 */
export async function uploadImageFile(
  file: File,
  folder: 'courses' | 'lessons'
): Promise<UploadImageResult> {
  if (!file) {
    return { success: false, error: 'No se seleccionó ningún archivo.' };
  }

  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'El archivo seleccionado no es una imagen válida (PNG, JPG, WEBP, GIF, SVG).'
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      success: false,
      error: 'La imagen supera el límite máximo permitido de 10 MB.'
    };
  }

  const { base, ext } = sanitizeFileName(file.name);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}.${ext}`;
  const objectPath = `${folder}/${uniqueName}`;

  // 1. Primary path: direct authenticated upload to Supabase Storage public bucket
  try {
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (!uploadError) {
      const { data: publicData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(objectPath);

      if (publicData?.publicUrl) {
        return {
          success: true,
          publicUrl: publicData.publicUrl,
          source: 'supabase'
        };
      }
    }
  } catch (clientErr) {
    console.warn('Subida directa a Supabase Storage no disponible, usando endpoint del servidor:', clientErr);
  }

  // 2. Secondary path: server endpoint (uses service_role Supabase Storage or local /uploads static store)
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      return {
        success: false,
        error: 'Tu sesión expiró. Inicia sesión nuevamente para subir imágenes.'
      };
    }

    const dataBase64 = await readFileAsBase64(file);
    const response = await fetch('/api/uploads/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        folder,
        dataBase64
      })
    });

    const json = (await response.json()) as UploadImageResult;
    if (!response.ok || !json.success || !json.publicUrl) {
      return {
        success: false,
        error: json.error || 'No se pudo subir la imagen al almacenamiento.'
      };
    }

    return {
      success: true,
      publicUrl: json.publicUrl,
      source: json.source || 'server'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error de conexión al subir la imagen.'
    };
  }
}
