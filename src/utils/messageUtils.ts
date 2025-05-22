
import { ReactNode } from 'react';

/**
 * Safely checks if content includes a substring, handling both string and ReactNode types
 * @param content The message content (string or ReactNode)
 * @param searchString The string to search for
 * @returns boolean indicating if the string is found
 */
export const contentIncludes = (content: string | ReactNode, searchString: string): boolean => {
  if (typeof content === 'string') {
    return content.includes(searchString);
  }
  return false;
};

/**
 * Gets string representation of content for operations requiring strings
 * @param content The message content (string or ReactNode)
 * @returns string representation or empty string if can't be converted
 */
export const getContentAsString = (content: string | ReactNode): string => {
  if (typeof content === 'string') {
    return content;
  }
  return '';
};

/**
 * Safely replaces text in content if it's a string
 * @param content The message content (string or ReactNode)
 * @param searchValue The string to search for
 * @param replaceValue The replacement string
 * @returns Modified string or original content if not a string
 */
export const contentReplace = (
  content: string | ReactNode, 
  searchValue: string | RegExp, 
  replaceValue: string
): string | ReactNode => {
  if (typeof content === 'string') {
    return content.replace(searchValue, replaceValue);
  }
  return content;
};
