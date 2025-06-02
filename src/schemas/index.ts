import { z } from 'zod/v4';

export const TagSchema = z.strictObject({
  Key: z
    .string()
    .min(1, { message: 'Tag key is required.' })
    .max(128, { message: 'Tag key must be at most 128 characters.' }),
  Value: z
    .string()
    .max(256, { message: 'Tag value must be at most 256 characters.' }),
});

export const TopicSchema = z.object({
  TopicName: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        'Topic name must contain only alphanumeric characters, underscores (_) or hyphens (-).',
    })
    .min(1, { message: 'Topic name is required.' })
    .max(64, { message: 'Topic name must be at most 64 characters.' }),
  DisplayName: z
    .string()
    .min(1, { message: 'Display name is required.' })
    .max(256, { message: 'Display name must be at most 256 characters.' }),
  Description: z
    .string()
    .max(1024, { message: 'Description must be at most 1024 characters.' })
    .optional(),
  DefaultSubscriptionStatus: z.enum(['OPT_IN', 'OPT_OUT'], {
    message: "DefaultSubscriptionStatus must be either 'OPT_IN' or 'OPT_OUT'.",
  }),
});

export const CreateContactListSchema = z.object({
  ContactListName: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        'Contact list name must contain only alphanumeric characters, underscores (_) or hyphens (-).',
    })
    .min(1, { message: 'Contact list name is required.' })
    .max(128, { message: 'Contact list name must be at most 128 characters.' }),
  Description: z
    .string()
    .max(256, { message: 'Description must be at most 256 characters.' })
    .optional(),
  Topics: z
    .array(TopicSchema, 'Topics must be an array of topic objects.')
    .optional(),
  Tags: z.array(TagSchema, 'Tags must be an array of tag objects.').optional(),
});

export const CreateTemplateSchema = z.object({
  TemplateName: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        'Template name must contain only alphanumeric characters, underscores (_) or hyphens (-).',
    })
    .min(1, { message: 'Template name is required.' }),
  Subject: z.string().min(1, { message: 'Subject is required.' }),
  Html: z.string().min(1, { message: 'HTML Content is required.' }),
  Text: z.string().min(1, { message: 'Text Content is required.' }),
});
