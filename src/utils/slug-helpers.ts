/* eslint-disable no-unused-vars */
import { customAlphabet } from 'nanoid';

export function slugify(text: string): string {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      // Remove accents/diacritics (é → e, ñ → n)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Replace special characters
      .replace(/[^\w-]+/g, '')
      // Replace multiple hyphens with single hyphen
      .replace(/--+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
  );
}

export function generateUniqueSlug(baseSlug: string, length = 6): string {
  // Use nanoid with custom alphabet (lowercase + numbers only)
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', length);
  const suffix = nanoid();

  return `${baseSlug}-${suffix}`;
}

export async function ensureUniqueSlug(
  slug: string,
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts = 5
): Promise<string> {
  let uniqueSlug = slug;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const exists = await checkExists(uniqueSlug);

    if (!exists) {
      return uniqueSlug;
    }

    // Generate new slug with random suffix
    uniqueSlug = generateUniqueSlug(slug, 6);
    attempts++;
  }

  // If all attempts failed, add timestamp as last resort
  return `${slug}-${Date.now()}`;
}

export async function createUniqueSlug(
  title: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = slugify(title);
  return ensureUniqueSlug(baseSlug, checkExists);
}
