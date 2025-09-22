import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseContent(content: string) {
  if (!content) return '';
  // Parse unicode escaped characters
  let retVal = content.replace(/"/g, '\\"').replace(/(?:\r\n|\r|\n)/g, '\\n');
  retVal = retVal.replace(/\\u([\d\w]{4})/gi, function (match, grp) {
    return String.fromCharCode(parseInt(grp, 16));
  });
  retVal = retVal.replace(/\\n/g, '\n');
  retVal = retVal.replace(/\\t/g, '\t');
  retVal = retVal.replace(/\\r/g, '\r');
  retVal = retVal.replace(/\\b/g, '\b');
  retVal = retVal.replace(/\\f/g, '\f');
  retVal = retVal.replace(/\\'/g, "'");
  retVal = retVal.replace(/\\"/g, '"');
  retVal = retVal.replace(/\\\\/g, '\\');
  return retVal;
}

export function extractTextFromHTML(htmlString: string): string {
  // Parse HTML string into a document
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const title = doc.title || '';
  const bodyText = doc.body?.textContent || '';

  // Combine title and body text
  const fullText = `${title} ${bodyText}`;

  // 1. Remove emojis.
  // 2. Collapse any resulting multiple spaces into a single space.
  // 3. Trim whitespace from the ends.
  return fullText
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
