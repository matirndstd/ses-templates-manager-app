import { ContactList } from '@/types';
import { Button } from '@/components/ui/button';

interface ListTagsProps {
  tags: ContactList['Tags'];
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const ListTags: React.FC<ListTagsProps> = ({ tags, handleChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-1 border rounded-full"
        >
          <span className="font-medium">{tag.Key}</span>
          <span>:</span>
          <span>{tag.Value || "''"}</span>
          <Button
            type="button"
            variant="destructive"
            className="text-red-500 hover:text-red-700 px-0 py-0 bg-transparent hover:bg-transparent"
            onClick={() => {
              handleChange({
                target: {
                  name: 'Tags',
                  value: tags.filter((_, i) => i !== index),
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any);
            }}
          >
            &times;
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ListTags;
