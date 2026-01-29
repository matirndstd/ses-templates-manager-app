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
