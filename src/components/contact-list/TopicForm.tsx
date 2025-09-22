import { useState } from 'react';
import { z } from 'zod/v4';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
import { ContactList } from '@/types';
import { TopicSchema } from '@/schemas';

interface TopicFormProps {
  topics: ContactList['Topics'];
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const TopicForm: React.FC<TopicFormProps> = ({ topics, handleChange }) => {
  const [tempTopic, setTempTopic] = useState({
    TopicName: '',
    DisplayName: '',
    Description: '',
    DefaultSubscriptionStatus: 'OPT_IN',
  });
  const [errors, setErrors] = useState<{
    TopicName?: string;
    DisplayName?: string;
    Description?: string;
    Error?: string;
  }>({});

  const validate = () => {
    const result = TopicSchema.safeParse(tempTopic);
    if (!result.success) {
      const fieldErrors = z.treeifyError(result.error).properties;
      setErrors({
        TopicName: fieldErrors.TopicName?.errors[0],
        DisplayName: fieldErrors.DisplayName?.errors[0],
        Description: fieldErrors.Description?.errors[0],
      });
      return false;
    }
    setErrors({});
    return true;
  };

  const addTopic = () => {
    if (!validate()) return;

    const isDuplicate = topics.some(
      (topic) => topic.TopicName === tempTopic.TopicName
    );
    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        Error: `Topic with name "${tempTopic.TopicName}" already exists.`,
      }));
      return;
    }

    handleChange({
      target: {
        name: 'Topics',
        value: [...topics, tempTopic],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    setTempTopic({
      TopicName: '',
      DisplayName: '',
      Description: '',
      DefaultSubscriptionStatus: 'OPT_IN',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <div>
        <Input
          placeholder="Topic Name"
          value={tempTopic.TopicName}
          onChange={(e) =>
            setTempTopic({
              ...tempTopic,
              TopicName: e.target.value,
            })
          }
          className={errors.TopicName ? 'border-destructive' : ''}
        />
        <p className="text-red-500 text-sm mt-1 ml-1">{errors.TopicName}</p>
      </div>

      <div>
        <Input
          placeholder="Display Name"
          value={tempTopic.DisplayName}
          onChange={(e) =>
            setTempTopic({
              ...tempTopic,
              DisplayName: e.target.value,
            })
          }
          className={errors.DisplayName ? 'border-destructive' : ''}
        />
        <p className="text-red-500 text-sm mt-1 ml-1">{errors.DisplayName}</p>
      </div>

      <div>
        <Textarea
          placeholder="Description"
          rows={2}
          value={tempTopic.Description}
          onChange={(e) =>
            setTempTopic({
              ...tempTopic,
              Description: e.target.value,
            })
          }
          className={`md:col-span-2 ${
            errors.Description ? 'border-destructive' : ''
          }`}
        />
        <p className="text-red-500 text-sm mt-1 ml-1">{errors.Description}</p>
      </div>

      <div>
        <Select
          name="DefaultSubscriptionStatus"
          value={tempTopic.DefaultSubscriptionStatus}
          onValueChange={(value) => {
            setTempTopic({
              ...tempTopic,
              DefaultSubscriptionStatus: value as 'OPT_IN' | 'OPT_OUT',
            });
          }}
        >
          <SelectTrigger aria-label="subscriber-type">
            <SelectValue placeholder="Select a subscriber type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key={1} value="OPT_IN">
              Subscribed by default
            </SelectItem>
            <SelectItem key={2} value="OPT_OUT">
              Not subscribed by default
            </SelectItem>
          </SelectContent>
        </Select>
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-1 border"
            onClick={addTopic}
            disabled={
              !tempTopic.TopicName.trim() || !tempTopic.DisplayName.trim()
            }
          >
            Add Topic
          </Button>
          <p className="inline-block text-red-500 text-sm ml-2">
            {errors.Error}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopicForm;
