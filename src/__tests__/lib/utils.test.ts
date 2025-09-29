import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cn, parseContent, extractTextFromHTML } from '@/lib/utils';

describe('Utils Library', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-red-500');
      expect(result).toBe('px-2 py-1 bg-red-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle null and undefined inputs', () => {
      const result = cn('base-class', null, undefined, 'other-class');
      expect(result).toBe('base-class other-class');
    });
  });

  describe('parseContent', () => {
    it('should return empty string for empty input', () => {
      expect(parseContent('')).toBe('');
      expect(parseContent(null as any)).toBe('');
      expect(parseContent(undefined as any)).toBe('');
    });

    it('should parse unicode escaped characters', () => {
      const input = 'Hello \\u0041\\u0042\\u0043'; // ABC in unicode
      const result = parseContent(input);
      expect(result).toBe('Hello ABC');
    });

    it('should handle lowercase unicode escapes', () => {
      const input = 'Test \\u0061\\u0062\\u0063'; // abc in unicode
      const result = parseContent(input);
      expect(result).toBe('Test abc');
    });

    it('should parse newline characters', () => {
      const input = 'Line 1\\nLine 2\\nLine 3';
      const result = parseContent(input);
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should parse escaped quotes', () => {
      const input = 'He said \"Hello\" to me';
      const result = parseContent(input);
      expect(result).toBe('He said "Hello" to me');
    });

    it('should parse escaped single quotes', () => {
      const input = "It\\'s a beautiful day";
      const result = parseContent(input);
      expect(result).toBe("It's a beautiful day");
    });
  });

  describe('extractTextFromHTML', () => {
    // Mock DOMParser for testing
    let mockDOMParser: any;
    let originalDOMParser: any;

    beforeEach(() => {
      originalDOMParser = global.DOMParser;
      mockDOMParser = vi.fn();
      global.DOMParser = mockDOMParser;
    });

    afterEach(() => {
      global.DOMParser = originalDOMParser;
    });

    it('should extract text from simple HTML', () => {
      const mockDoc = {
        title: 'Page Title',
        body: {
          textContent: 'This is the body content',
        },
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = '<html><head><title>Page Title</title></head><body>This is the body content</body></html>';
      const result = extractTextFromHTML(html);

      expect(result).toBe('Page Title This is the body content');
      expect(mockDOMParser).toHaveBeenCalledWith();
    });

    it('should handle HTML without title', () => {
      const mockDoc = {
        title: '',
        body: {
          textContent: 'Body content only',
        },
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = '<body>Body content only</body>';
      const result = extractTextFromHTML(html);

      expect(result).toBe('Body content only');
    });

    it('should handle HTML without body', () => {
      const mockDoc = {
        title: 'Title Only',
        body: null,
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = '<title>Title Only</title>';
      const result = extractTextFromHTML(html);

      expect(result).toBe('Title Only');
    });

    it('should normalize whitespace', () => {
      const mockDoc = {
        title: 'Page   Title',
        body: {
          textContent: 'This   is    the\n\nbody\t\tcontent',
        },
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = '<html><head><title>Page   Title</title></head><body>This   is    the\n\nbody\t\tcontent</body></html>';
      const result = extractTextFromHTML(html);

      expect(result).toBe('Page Title This is the body content');
    });

    it('should remove emojis and symbols', () => {
      const mockDoc = {
        title: 'Page Title 🚀',
        body: {
          textContent: 'Hello 👋 World 🌍 with emojis 😊 and symbols ⭐',
        },
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = '<html><head><title>Page Title 🚀</title></head><body>Hello 👋 World 🌍 with emojis 😊 and symbols ⭐</body></html>';
      const result = extractTextFromHTML(html);

      expect(result).toBe('Page Title Hello World with emojis and symbols');
    });

    it('should handle empty HTML', () => {
      const mockDoc = {
        title: '',
        body: {
          textContent: '',
        },
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = '';
      const result = extractTextFromHTML(html);

      expect(result).toBe('');
    });

    it('should handle HTML with nested elements', () => {
      const mockDoc = {
        title: 'Complex Page',
        body: {
          textContent: 'Header Content Main content with links Footer content',
        },
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = `
        <html>
          <head><title>Complex Page</title></head>
          <body>
            <header>Header Content</header>
            <main>
              <p>Main content with <a href="#">links</a></p>
            </main>
            <footer>Footer content</footer>
          </body>
        </html>
      `;
      const result = extractTextFromHTML(html);

      expect(result).toBe('Complex Page Header Content Main content with links Footer content');
    });

    it('should handle HTML with only emojis', () => {
      const mockDoc = {
        title: '🚀🌍⭐',
        body: {
          textContent: '👋😊🎉',
        },
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = '<title>🚀🌍⭐</title><body>👋😊🎉</body>';
      const result = extractTextFromHTML(html);

      expect(result).toBe('');
    });

    it('should handle mixed content with text and emojis', () => {
      const mockDoc = {
        title: 'Welcome 🎉 to our site',
        body: {
          textContent: 'Check out our new features! 🚀 They are amazing ⭐ and fun 😊',
        },
      };

      mockDOMParser.mockImplementation(() => ({
        parseFromString: () => mockDoc,
      }));

      const html = '<title>Welcome 🎉 to our site</title><body>Check out our new features! 🚀 They are amazing ⭐ and fun 😊</body>';
      const result = extractTextFromHTML(html);

      expect(result).toBe('Welcome to our site Check out our new features! They are amazing and fun');
    });

    it('should call DOMParser with correct parameters', () => {
      const mockParseFromString = vi.fn().mockReturnValue({
        title: 'Test',
        body: { textContent: 'Content' },
      });

      mockDOMParser.mockImplementation(() => ({
        parseFromString: mockParseFromString,
      }));

      const html = '<html><body>Test</body></html>';
      extractTextFromHTML(html);

      expect(mockParseFromString).toHaveBeenCalledWith(html, 'text/html');
    });
  });
});