import {
  CreateContactListRequest,
  GetContactListResponse,
} from '@aws-sdk/client-sesv2';

export interface EmailTemplate {
  id: string;
  TemplateName: string;
  Subject: string;
  Html: string;
  Text: string;
  dynamicFields?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEmailTemplateInput = Omit<
  EmailTemplate,
  'id' | 'dynamicFields' | 'createdAt' | 'updatedAt'
>;
export type UpdateEmailTemplateInput = Partial<CreateEmailTemplateInput>;

export interface SendEmailParams {
  templateName: string;
  fromEmail: string;
  toEmails: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templateData?: Record<string, any>;
}

export interface TopicPreference {
  TopicName: string;
  SubscriptionStatus: 'OPT_IN' | 'OPT_OUT';
}

export type ContactList = GetContactListResponse & {
  ContactListName: string;
};

export type CreateContactListInput = CreateContactListRequest;
export type UpdateContactListInput = Partial<CreateContactListRequest>;
