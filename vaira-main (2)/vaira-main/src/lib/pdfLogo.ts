/**
 * VCL Logo utilities for PDF and email embedding.
 * Logo is now served from /uploads/ on Hostinger instead of Supabase Storage.
 */

import { uploadApi } from "@/lib/apiClient";

let logoBase64Cache: string | null = null;

export async function getLogoBase64(): Promise<string> {
  if (logoBase64Cache) return logoBase64Cache;

  try {
    const logoModule = await import('@/assets/vcl-logo.png');
    const response = await fetch(logoModule.default);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        logoBase64Cache = base64.split(',')[1];
        resolve(logoBase64Cache!);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load VCL logo for PDF:', error);
    return '';
  }
}

export function getLogoBase64Sync(): string | null {
  return logoBase64Cache;
}

/**
 * Returns the public URL of the email logo.
 * Checks /uploads/email-logo.png first (custom), falls back to /uploads/vcl-logo.png (default).
 */
export async function ensureLogoInStorage(): Promise<string> {
  try {
    const { exists, url } = await uploadApi.checkLogo();
    if (exists && url) return url;

    // No custom logo — return the static default logo URL
    return window.location.origin + '/uploads/vcl-logo.png';
  } catch {
    return window.location.origin + '/uploads/vcl-logo.png';
  }
}

export async function preloadLogo(): Promise<void> {
  await getLogoBase64();
}
