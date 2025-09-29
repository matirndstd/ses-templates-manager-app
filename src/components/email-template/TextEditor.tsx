import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TextEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  generateContent: () => void;
  error?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  generateContent,
  error,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex flex items-center justify-between mt-3">
        <Label htmlFor="Text">Text Content</Label>
        <p
          className="text-sm font-medium text-blue-500 hover:underline cursor-pointer"
          onClick={generateContent}
        >
          Generate content
        </p>
      </div>
      <Textarea
        id="Text"
        name="Text"
        value={value || ''}
        onChange={onChange}
        className={`min-h-[300px] font-mono ${
          error ? 'border-destructive' : ''
        }`}
        placeholder="Your plain text content here"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default TextEditor;
