import { Button } from '@/components/ui/button';
import { ContactList } from '@/types';

interface ListTopicsProps {
  topics: ContactList['Topics'];
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const ListTopics: React.FC<ListTopicsProps> = ({ topics, handleChange }) => {
  return (
    <div className="mt-4 space-y-2">
      {topics.map((topic) => (
        <div
          key={topic.TopicName}
          className="border p-3 rounded space-y-1 bg-muted text-sm"
        >
          <div>
            <strong>Name:</strong> {topic.TopicName}
          </div>
          <div>
            <strong>Display:</strong> {topic.DisplayName}
          </div>
          <div>
            <strong>Description:</strong> {topic.Description}
          </div>
          <div>
            <strong>Status:</strong> {topic.DefaultSubscriptionStatus}
          </div>
          <Button
            type="button"
            variant="outline"
            className="px-1 py-1 bg-red-500 hover:bg-destructive"
            onClick={() => {
              handleChange({
                target: {
                  name: 'Topics',
                  value: topics.filter((t) => t.TopicName !== topic.TopicName),
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any);
            }}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ListTopics;
