import { useState } from 'react';
import { z } from 'zod/v4';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContactList } from '@/types';
import { TagSchema } from '@/schemas';

interface TagFormProps {
  tags: ContactList['Tags'];
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const TagForm: React.FC<TagFormProps> = ({ tags, handleChange }) => {
  const [tempTag, setTempTag] = useState({ Key: '', Value: '' });
  const [errors, setErrors] = useState<{
    Key?: string;
    Value?: string;
    Error?: string;
  }>({});

  const validate = () => {
    const result = TagSchema.safeParse(tempTag);
    if (!result.success) {
      const fieldErrors = z.treeifyError(result.error).properties;
      setErrors({
        Key: fieldErrors.Key?.errors[0],
        Value: fieldErrors.Value?.errors[0],
      });
      return false;
    }
    setErrors({});
    return true;
  };

  const addTag = () => {
    if (!validate()) return;

    const isDuplicate = tags.some((tag) => tag.Key === tempTag.Key);
    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        Error: `Tag with key "${tempTag.Key}" already exists.`,
      }));
      return;
    }

    handleChange({
      target: {
        name: 'Tags',
        value: [...tags, { ...tempTag }],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    setTempTag({ Key: '', Value: '' });
  };
  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex flex-row gap-2 mt-2 w-2/4">
        <div>
          <Input
            name="TagKey"
            id="TagKey"
            placeholder="Key"
            value={tempTag.Key}
            onChange={(e) => setTempTag({ ...tempTag, Key: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            className={errors.Key ? 'border-destructive' : ''}
          />
          {errors.Key && (
            <p className="text-red-500 text-sm mt-1 ml-1">{errors.Key}</p>
          )}
        </div>
        <div>
          <Input
            name="TagValue"
            id="TagValue"
            placeholder="Value"
            value={tempTag.Value}
            onChange={(e) => setTempTag({ ...tempTag, Value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            className={errors.Value ? 'border-destructive' : ''}
          />
          {errors.Value && (
            <p className="text-red-500 text-sm mt-1 ml-1">{errors.Value}</p>
          )}
        </div>

        <Button
          type="button"
          size="md"
          variant="secondary"
          className="py-0 px-3 border"
          onClick={addTag}
          disabled={!tempTag.Key.trim()}
        >
          Add
        </Button>
      </div>
      <p className="text-red-500 text-sm ml-1">{errors.Error}</p>
    </div>
  );
};

export default TagForm;
