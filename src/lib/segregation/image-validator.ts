import { ImageQualityAssessment } from "./types";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Server-side buffer validation verifying file headers and byte bounds
 */
export function validateImageBuffer(buffer: Buffer, mimeType: string): ImageQualityAssessment {
  const warnings: string[] = [];

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      isTooDark: false,
      isBlurry: false,
      brightnessScore: 0,
      sharpnessScore: 0,
      warnings: ["Unsupported format. Only JPG, PNG, and WebP photographs are supported."],
    };
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    return {
      isValid: false,
      isTooDark: false,
      isBlurry: false,
      brightnessScore: 0,
      sharpnessScore: 0,
      warnings: ["File exceeds the 5MB size limit. Please upload an optimized photo."],
    };
  }

  // Magic bytes check for JPEG, PNG, WebP
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // WEBP header 'RIFF'

  if (!isJpeg && !isPng && !isRiff) {
    return {
      isValid: false,
      isTooDark: false,
      isBlurry: false,
      brightnessScore: 0,
      sharpnessScore: 0,
      warnings: ["Corrupted or invalid image headers. Please take a new photograph."],
    };
  }

  return {
    isValid: true,
    isTooDark: false,
    isBlurry: false,
    brightnessScore: 128,
    sharpnessScore: 80,
    warnings,
  };
}

/**
 * Client-side browser pre-flight quality analyzer using HTML5 Canvas
 */
export async function analyzeBrowserImageQuality(file: File): Promise<ImageQualityAssessment> {
  const warnings: string[] = [];

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      isValid: false,
      isTooDark: false,
      isBlurry: false,
      brightnessScore: 0,
      sharpnessScore: 0,
      warnings: ["Image exceeds 5MB size limit. Please choose an optimized photograph."],
    };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      isTooDark: false,
      isBlurry: false,
      brightnessScore: 0,
      sharpnessScore: 0,
      warnings: ["Only JPG, PNG, and WebP formats are supported."],
    };
  }

  // In non-browser environments, return basic pass
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      isValid: true,
      isTooDark: false,
      isBlurry: false,
      brightnessScore: 128,
      sharpnessScore: 80,
      warnings: [],
    };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    // Downscale for fast analytical compute (approx 120x120)
    const scale = Math.min(120 / bitmap.width, 120 / bitmap.height, 1);
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return {
        isValid: true,
        isTooDark: false,
        isBlurry: false,
        brightnessScore: 128,
        sharpnessScore: 80,
        warnings: [],
      };
    }

    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalLuminance = 0;
    const pixelCount = data.length / 4;
    const grayPixels: number[] = new Array(pixelCount);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // ITU-R BT.601 standard luma formula
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += luma;
      grayPixels[i / 4] = luma;
    }

    const averageBrightness = Math.round(totalLuminance / pixelCount);
    const isTooDark = averageBrightness < 35; // Threshold for severely underexposed photos

    if (isTooDark) {
      warnings.push(
        "Photograph is very dark. Packaging details and resin codes may be difficult to resolve. Consider capturing with flash or in a well-lit area."
      );
    }

    // Estimate sharpness via horizontal and vertical delta variance
    let diffSum = 0;
    const w = canvas.width;
    const h = canvas.height;
    let comparisons = 0;

    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w - 1; x++) {
        const current = grayPixels[y * w + x];
        const right = grayPixels[y * w + (x + 1)];
        const down = grayPixels[(y + 1) * w + x];
        diffSum += Math.abs(current - right) + Math.abs(current - down);
        comparisons += 2;
      }
    }

    const sharpnessScore = Math.round((diffSum / comparisons) * 10);
    const isBlurry = sharpnessScore < 20; // Threshold for severely out-of-focus or motion-blurred photos

    if (isBlurry) {
      warnings.push(
        "Photograph appears blurry. If classification results are ambiguous, hold the device steady and refocus on the discarded items."
      );
    }

    return {
      isValid: true,
      isTooDark,
      isBlurry,
      brightnessScore: averageBrightness,
      sharpnessScore,
      warnings,
    };
  } catch (err) {
    // If canvas analysis encounters browser restriction, gracefully permit upload
    return {
      isValid: true,
      isTooDark: false,
      isBlurry: false,
      brightnessScore: 128,
      sharpnessScore: 80,
      warnings: [],
    };
  }
}

