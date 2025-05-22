
import { ReactNode } from "react";

/**
 * Check if ReactNode content includes a substring
 */
export function contentIncludes(content: ReactNode, substring: string): boolean {
  if (content === null || content === undefined) return false;
  if (typeof content === 'string') return content.includes(substring);
  if (typeof content === 'number') return String(content).includes(substring);
  
  return false;
}

/**
 * Convert ReactNode content to string safely
 */
export function getContentAsString(content: ReactNode): string {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (typeof content === 'number') return String(content);
  
  // For complex ReactNodes, we can't really convert them to strings meaningfully
  return '';
}

/**
 * Perform string replacement on ReactNode content
 */
export function contentReplace(content: ReactNode, pattern: string | RegExp, replacement: string): string {
  const contentStr = getContentAsString(content);
  return contentStr.replace(pattern, replacement);
}

/**
 * Get substring from ReactNode content
 */
export function contentSubstring(content: ReactNode, start: number, end?: number): string {
  const contentStr = getContentAsString(content);
  return contentStr.substring(start, end);
}

/**
 * Check if content is empty
 */
export function isContentEmpty(content: ReactNode): boolean {
  const contentStr = getContentAsString(content);
  return contentStr.trim() === '';
}

/**
 * Convert content to lowercase
 */
export function contentToLowerCase(content: ReactNode): string {
  const contentStr = getContentAsString(content);
  return contentStr.toLowerCase();
}
