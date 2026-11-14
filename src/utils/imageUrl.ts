import type { SyntheticEvent } from 'react';

export const DEFAULT_COURSE_IMAGE =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';

/**
 * Extracts the file ID from common Google Drive / Googleusercontent image URLs.
 * Explicitly ignores Google Drive folder URLs so they are not treated as image files.
 */
export function extractGoogleDriveFileId(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject Google Drive folder links
  if (/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//i.test(trimmed)) {
    return null;
  }

  // 1. https://lh3.googleusercontent.com/d/<FILE_ID> or https://lh3.googleusercontent.com/drive-viewer/...
  const lh3Match = trimmed.match(/https?:\/\/lh\d*\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (lh3Match?.[1]) {
    return lh3Match[1];
  }

  // 2. https://drive.google.com/file/d/<FILE_ID>/view... or /file/u/0/d/<FILE_ID>/...
  const filePathMatch = trimmed.match(
    /https?:\/\/(?:drive|docs)\.google\.com\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{10,})/i
  );
  if (filePathMatch?.[1]) {
    return filePathMatch[1];
  }

  // 3. https://drive.google.com/open?id=<FILE_ID> | /uc?id=<FILE_ID> | /thumbnail?id=<FILE_ID>
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (host === 'drive.google.com' || host === 'docs.google.com' || host === 'drive.usercontent.google.com') {
      const idParam = parsed.searchParams.get('id');
      if (idParam && /^[a-zA-Z0-9_-]{10,}$/.test(idParam)) {
        return idParam;
      }
      const dPathMatch = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
      if (dPathMatch?.[1]) {
        return dPathMatch[1];
      }
    }
  } catch {
    // Fallback regex if URL constructor fails on partial input
    const queryIdMatch = trimmed.match(
      /https?:\/\/(?:drive|docs)\.google\.com\/(?:open|uc|thumbnail)\?[^#\s]*[?&]id=([a-zA-Z0-9_-]{10,})/i
    );
    if (queryIdMatch?.[1]) {
      return queryIdMatch[1];
    }
  }

  return null;
}

/**
 * Checks whether a URL points to a Google Drive folder instead of an image file.
 */
export function isGoogleDriveFolderUrl(rawUrl: string): boolean {
  return /https?:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//i.test((rawUrl || '').trim());
}

/**
 * Converts a Google Drive URL to direct image streaming format:
 * https://lh3.googleusercontent.com/d/[FILE_ID]
 * Leaves standard image URLs untouched and returns fallback when empty.
 */
export function normalizeImageUrl(rawUrl?: string | null, fallback: string = DEFAULT_COURSE_IMAGE): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return fallback;

  const driveFileId = extractGoogleDriveFileId(trimmed);
  if (driveFileId) {
    return `https://lh3.googleusercontent.com/d/${driveFileId}`;
  }

  return trimmed;
}

/**
 * Normalizes any Google Drive links embedded inside markdown image syntax `![alt](url)`.
 */
export function normalizeMarkdownImageUrls(markdown: string): string {
  if (!markdown) return markdown;
  return markdown.replace(/!\[(.*?)\]\((.*?)\)/g, (_match, alt: string, url: string) => {
    const normalized = normalizeImageUrl(url, url.trim());
    return `![${alt}](${normalized})`;
  });
}

export interface ImageUrlValidationResult {
  isValid: boolean;
  isGoogleDrive: boolean;
  isDriveFolder: boolean;
  normalizedUrl: string;
  error?: string;
  info?: string;
}

/**
 * Validates and normalizes an image URL entered in the Admin panel.
 */
export function validateCourseImageUrl(rawUrl: string): ImageUrlValidationResult {
  const trimmed = (rawUrl || '').trim();

  if (!trimmed) {
    return {
      isValid: true,
      isGoogleDrive: false,
      isDriveFolder: false,
      normalizedUrl: DEFAULT_COURSE_IMAGE
    };
  }

  if (isGoogleDriveFolderUrl(trimmed)) {
    return {
      isValid: false,
      isGoogleDrive: true,
      isDriveFolder: true,
      normalizedUrl: trimmed,
      error: 'El enlace apunta a una carpeta de Google Drive. Debes pegar el enlace de un archivo de imagen individual.'
    };
  }

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    const directUrl = `https://lh3.googleusercontent.com/d/${driveId}`;
    return {
      isValid: true,
      isGoogleDrive: true,
      isDriveFolder: false,
      normalizedUrl: directUrl,
      info: trimmed === directUrl
        ? 'Enlace directo de Google Drive válido.'
        : 'Enlace de Google Drive detectado y convertido a formato directo de imagen.'
    };
  }

  if (/drive\.google\.com/i.test(trimmed)) {
    return {
      isValid: false,
      isGoogleDrive: true,
      isDriveFolder: false,
      normalizedUrl: trimmed,
      error: 'No se pudo extraer el ID del archivo de Google Drive. Usa un enlace del tipo "https://drive.google.com/file/d/ID/view".'
    };
  }

  // Allow relative assets starting with / or data:image URIs or valid http(s) URLs
  if (trimmed.startsWith('/') || /^data:image\//i.test(trimmed)) {
    return {
      isValid: true,
      isGoogleDrive: false,
      isDriveFolder: false,
      normalizedUrl: trimmed
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        isGoogleDrive: false,
        isDriveFolder: false,
        normalizedUrl: trimmed,
        error: 'La URL de la imagen debe comenzar con http:// o https://'
      };
    }
    return {
      isValid: true,
      isGoogleDrive: false,
      isDriveFolder: false,
      normalizedUrl: trimmed
    };
  } catch {
    return {
      isValid: false,
      isGoogleDrive: false,
      isDriveFolder: false,
      normalizedUrl: trimmed,
      error: 'Introduce una URL válida (por ejemplo, https://... o un enlace compartido de Google Drive).'
    };
  }
}

/**
 * Shared React <img> onError handler that swaps broken images to DEFAULT_COURSE_IMAGE once,
 * preventing infinite retry loops if the placeholder itself fails to load.
 */
export function handleImageLoadError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = DEFAULT_COURSE_IMAGE
): void {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === 'true') {
    img.style.display = 'none';
    return;
  }
  img.dataset.fallbackApplied = 'true';
  if (img.src !== fallback) {
    img.src = fallback;
  } else {
    img.style.display = 'none';
  }
}
