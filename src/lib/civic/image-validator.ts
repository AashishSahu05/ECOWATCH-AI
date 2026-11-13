/**
 * EcoWatch AI — Module 03: Civic Issue Reporting & Geo-Tagging
 * Photographic Evidence Validation & Quality Inspector
 */

export const MAX_CIVIC_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB per PRD
export const ALLOWED_CIVIC_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface CivicImageValidationResult {
  isValid: boolean;
  warnings: string[];
  fileSizeBytes: number;
  mimeType: string;
}

/**
 * Validates image buffer, headers, MIME type, and size constraints.
 */
export function validateCivicImageBuffer(
  buffer: Buffer,
  mimeType: string
): CivicImageValidationResult {
  const warnings: string[] = [];

  if (!ALLOWED_CIVIC_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      warnings: ["Unsupported format. Only JPG, PNG, and WebP evidence photographs are accepted."],
      fileSizeBytes: buffer.length,
      mimeType,
    };
  }

  if (buffer.length === 0) {
    return {
      isValid: false,
      warnings: ["Image file is empty (0 bytes)."],
      fileSizeBytes: 0,
      mimeType,
    };
  }

  if (buffer.length > MAX_CIVIC_IMAGE_BYTES) {
    return {
      isValid: false,
      warnings: ["Photograph exceeds the 10MB size limit. Please compress or optimize the photo."],
      fileSizeBytes: buffer.length,
      mimeType,
    };
  }

  // Magic bytes check
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // 'RIFF'

  if (!isJpeg && !isPng && !isWebp) {
    return {
      isValid: false,
      warnings: ["Corrupted or invalid image headers. Please capture or upload a new photo."],
      fileSizeBytes: buffer.length,
      mimeType,
    };
  }

  return {
    isValid: true,
    warnings: [],
    fileSizeBytes: buffer.length,
    mimeType,
  };
}

