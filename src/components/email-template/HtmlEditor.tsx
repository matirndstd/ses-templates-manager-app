import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import { Label } from '@/components/ui/label';

interface HtmlEditorProps {
  value: string;
  onChange: (code: string) => void;
  error?: string;
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({ value, onChange, error }) => {
  const detectLanguage = (code: string): string => {
    if (code.includes('<style') && code.includes('</style>')) {
      return 'css';
    }
    return 'markup';
  };

  const highlightWithLanguage = (code: string) => {
    const language = detectLanguage(code);
    return highlight(code, languages[language], language);
  };

  return (
    <div className="space-y-2 container__editor">
      <Label htmlFor="Html">HTML Content</Label>
      <div
        className={`border rounded-md overflow-hidden ${
          error ? 'border-destructive' : 'border-input'
        }`}
      >
        <Editor
          value={value || ''}
          onValueChange={onChange}
          highlight={highlightWithLanguage}
          padding={16}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
            fontVariantLigatures: 'common-ligatures',
            minHeight: '300px',
            borderRadius: '3px',
            outline: 0,
          }}
          className="w-full bg-background text-foreground"
          textareaId="Html"
          placeholder="Your HTML content here"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default HtmlEditor;
