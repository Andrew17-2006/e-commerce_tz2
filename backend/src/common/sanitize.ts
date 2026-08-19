import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * These fields (product/category text, shipping details, user name) are always rendered
 * as plain text on the frontend — they should never contain markup at all, so we strip
 * every tag rather than allow a "safe" HTML subset.
 */
export function stripHtml(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

/** class-validator/class-transformer decorator: strips HTML from a string field before validation runs. */
export function SanitizeHtml(): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? stripHtml(value) : value));
}
