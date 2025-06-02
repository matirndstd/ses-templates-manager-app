import { ContactList } from '@/types';

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
          <button
            type="button"
            className="text-red-500 hover:text-red-700 ml-1 cursor-pointer"
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
          </button>
        </div>
      ))}
    </div>
  );
};

export default ListTags;
