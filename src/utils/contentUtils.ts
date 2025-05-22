
import { ReactNode } from 'react';

/**
 * Check if a ReactNode content includes a specific string
 * @param content The content to check
 * @param searchStr The string to search for
 * @returns True if the content includes the string, false otherwise
 */
export function contentIncludes(content: ReactNode | string, searchStr: string): boolean {
  if (content === null || content === undefined) {
    return false;
  }
  
  // If it's a string, just do a direct includes check
  if (typeof content === 'string') {
    return content.includes(searchStr);
  }
  
  // Try to convert to string if possible
  const contentStr = getContentAsString(content);
  return contentStr ? contentStr.includes(searchStr) : false;
}

/**
 * Convert a ReactNode to a string if possible
 * @param content The content to convert
 * @returns The content as a string, or null if not possible
 */
export function getContentAsString(content: ReactNode | string): string | null {
  if (content === null || content === undefined) {
    return null;
  }
  
  // If it's already a string, return it
  if (typeof content === 'string') {
    return content;
  }
  
  // Try to convert to string
  try {
    // Handle arrays by joining them
    if (Array.isArray(content)) {
      return content.map(item => getContentAsString(item)).join('');
    }
    
    // Handle JSX elements by returning their toString
    if (
      typeof content === 'object' &&
      content !== null &&
      'toString' in content
    ) {
      return content.toString();
    }
    
    // Last resort - try JSON stringify
    return JSON.stringify(content);
  } catch (error) {
    console.error('Error converting content to string:', error);
    return null;
  }
}

/**
 * Replace all occurrences of a string in a content
 * @param content The content to modify
 * @param searchStr The string to search for
 * @param replaceStr The string to replace with
 * @returns The modified content
 */
export function contentReplace(content: string, searchStr: string, replaceStr: string): string {
  if (typeof content !== 'string') {
    return content;
  }
  
  return content.replace(new RegExp(searchStr, 'g'), replaceStr);
}
