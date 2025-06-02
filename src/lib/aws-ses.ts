import {
  SESv2Client,
  ListContactListsCommand,
  CreateContactListCommand,
  CreateContactListResponse,
  GetContactListCommand,
  UpdateContactListCommand,
  DeleteContactListCommand,
  ListEmailTemplatesCommand,
  GetEmailTemplateCommand,
  Template,
  CreateEmailTemplateCommand,
  UpdateEmailTemplateCommand,
  DeleteEmailTemplateCommand,
  SendEmailCommand,
} from '@aws-sdk/client-sesv2';
import {
  EmailTemplate,
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
  ContactList,
  CreateContactListInput,
  UpdateContactListInput,
} from '@/types';
import { toast } from 'sonner';

// Initialize SES V2 client with credentials from localStorage
const getSESClientV2 = (): SESv2Client | null => {
  const storedCredentials = localStorage.getItem('awsCredentials');

  if (!storedCredentials) {
    toast.error('AWS credentials not found. Please login first.');
    return null;
  }

  try {
    const { region, accessKeyId, secretAccessKey } =
      JSON.parse(storedCredentials);

    return new SESv2Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } catch (error) {
    console.error('Error initializing SES V2 client:', error);
    toast.error('Failed to initialize AWS V2 client. Please login again.');
    return null;
  }
};

// This function is used to extract dynamic fields from the template content
const getDynamicFields = (contentStr: string) => {
  let dynamicFieldsArr = [];
  if (contentStr) {
    const matchRegex = contentStr.match(/{{\s*[\w.]+\s*}}/g); // match on any mustache templates
    if (matchRegex) {
      dynamicFieldsArr = matchRegex.map(function (x) {
        return x.match(/[\w.]+/)[0];
      });
    }
  }

  return dynamicFieldsArr;
};

// Convert AWS SES template to our app's template format
const convertToAppTemplate = (
  template: Template,
  id: string
): EmailTemplate => {
  // get dynamic fields from the template
  const { Subject, Text, Html } = template.TemplateContent;

  let dynamicFieldsArr = [];
  dynamicFieldsArr = [...dynamicFieldsArr, ...getDynamicFields(Subject)]; // Subject
  dynamicFieldsArr = [...dynamicFieldsArr, ...getDynamicFields(Text)]; // Text
  dynamicFieldsArr = [...dynamicFieldsArr, ...getDynamicFields(Html)]; // Html
  dynamicFieldsArr = Array.from(new Set(dynamicFieldsArr)); // removes any dupes

  return {
    id,
    TemplateName: template.TemplateName || '',
    Subject: Subject || '',
    Html: Html || '',
    Text: Text || '',
    dynamicFields: dynamicFieldsArr || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// List all templates with optional filtering
export const listTemplates = async (
  searchTerm?: string
): Promise<EmailTemplate[]> => {
  const client = getSESClientV2();
  if (!client) return [];

  try {
    const command = new ListEmailTemplatesCommand({ PageSize: 100 });
    const response = await client.send(command);

    const templateMetadata = response.TemplatesMetadata || [];

    // Filter templates if search term is provided
    const filteredTemplates = searchTerm
      ? templateMetadata.filter((template) =>
          template.TemplateName?.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
        )
      : templateMetadata;

    // For each template metadata, fetch the full template
    const templates = await Promise.all(
      filteredTemplates.map(async (metadata) => {
        const templateName = metadata.TemplateName as string;
        const templateData = await getTemplateById(templateName);
        return templateData as EmailTemplate;
      })
    );

    return templates.filter(
      (template) => template !== undefined
    ) as EmailTemplate[];
  } catch (error) {
    console.error('Error listing templates:', error);
    toast.error('Failed to list templates from AWS SES');
    throw error;
  }
};

// Get a single template by ID (TemplateName)
export const getTemplateById = async (
  id: string
): Promise<EmailTemplate | undefined> => {
  const client = getSESClientV2();
  if (!client) return undefined;

  try {
    const command = new GetEmailTemplateCommand({
      TemplateName: id,
    });

    const response = await client.send(command);
    if (!response.TemplateName) return undefined;

    return convertToAppTemplate(response, id);
  } catch (error) {
    console.error(`Error getting template ${id}:`, error);
    toast.error(`Failed to get template "${id}" from AWS SES`);
    throw error;
  }
};

// Create a new template
export const createTemplate = async (
  data: CreateEmailTemplateInput
): Promise<EmailTemplate> => {
  const client = getSESClientV2();
  if (!client) throw new Error('No SES client available');

  try {
    const command = new CreateEmailTemplateCommand({
      TemplateName: data.TemplateName,
      TemplateContent: {
        Subject: data.Subject,
        Html: data.Html,
        Text: data.Text,
      },
    });

    await client.send(command);

    // Return the newly created template
    return {
      id: data.TemplateName,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating template:', error);
    toast.error('Failed to create template in AWS SES');
    throw error;
  }
};

// Update an existing template
export const updateTemplate = async (
  id: string,
  data: UpdateEmailTemplateInput
): Promise<EmailTemplate> => {
  const client = getSESClientV2();
  if (!client) throw new Error('No SES client available');

  try {
    // Get existing template to merge with updates
    const existingTemplate = await getTemplateById(id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    // If template name is changing, we need to create a new one and delete the old one
    if (data.TemplateName && data.TemplateName !== id) {
      // Create new template with new name
      await createTemplate({
        TemplateName: data.TemplateName,
        Subject: data.Subject || existingTemplate.Subject,
        Html: data.Html || existingTemplate.Html,
        Text: data.Text || existingTemplate.Text,
      });

      // Delete old template
      await deleteTemplate(id);

      // Return the updated template
      return {
        id: data.TemplateName,
        TemplateName: data.TemplateName,
        Subject: data.Subject || existingTemplate.Subject,
        Html: data.Html || existingTemplate.Html,
        Text: data.Text || existingTemplate.Text,
        createdAt: existingTemplate.createdAt,
        updatedAt: new Date(),
      };
    }

    // Otherwise, update the existing template
    const command = new UpdateEmailTemplateCommand({
      TemplateName: id,
      TemplateContent: {
        Subject: data.Subject || existingTemplate.Subject,
        Html: data.Html || existingTemplate.Html,
        Text: data.Text || existingTemplate.Text,
      },
    });

    await client.send(command);

    // Return the updated template
    return {
      ...existingTemplate,
      ...data,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error(`Error updating template ${id}:`, error);
    toast.error(`Failed to update template "${id}" in AWS SES`);
    throw error;
  }
};

// Delete a template
export const deleteTemplate = async (id: string): Promise<void> => {
  const client = getSESClientV2();
  if (!client) throw new Error('No SES client available');

  try {
    const command = new DeleteEmailTemplateCommand({
      TemplateName: id,
    });

    await client.send(command);
  } catch (error) {
    console.error(`Error deleting template ${id}:`, error);
    toast.error(`Failed to delete template "${id}" from AWS SES`);
    throw error;
  }
};

// Send an email using a template
export const sendTemplatedEmail = async (
  templateName: string,
  fromEmail: string,
  recipients: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  templateData: Record<string, any> = {}
): Promise<string> => {
  const client = getSESClientV2();
  if (!client) throw new Error('No SES client available');

  try {
    /* const command = new SendTemplatedEmailCommand({
      Source: source,
      Destination: {
        ToAddresses: to,
      },
      Template: templateName,
      TemplateData: JSON.stringify(templateData),
    }); */

    const command = new SendEmailCommand({
      FromEmailAddress: fromEmail,
      Destination: {
        ToAddresses: recipients,
      },
      Content: {
        Template: {
          TemplateName: templateName,
          TemplateData: JSON.stringify(templateData),
        },
      },
    });

    const response = await client.send(command);
    return response.MessageId || '';
  } catch (error) {
    console.error('Error sending templated email:', error);
    throw error;
  }
};

// Get a single contact list by name (ContactListName)
export const getContactListByName = async (
  name: string
): Promise<ContactList | undefined> => {
  const client = getSESClientV2();
  if (!client) return undefined;

  try {
    const command = new GetContactListCommand({
      ContactListName: name,
    });

    return (await client.send(command)) as ContactList;
  } catch (error) {
    console.error(`Error getting contact list ${name}:`, error);
    throw error;
  }
};

// List all contact list
export const listContactList = async (
  searchTerm?: string
): Promise<ContactList[]> => {
  const client = getSESClientV2();
  if (!client) return [];

  try {
    const command = new ListContactListsCommand();
    const response = await client.send(command);

    const contactListMetadata = response.ContactLists || [];

    // Filter contact list if search term is provided
    const filteredTemplates = searchTerm
      ? contactListMetadata.filter((contactList) =>
          contactList.ContactListName?.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
        )
      : contactListMetadata;

    // For each contact list metadata, fetch the full contact list
    const contactLists: ContactList[] = await Promise.all(
      filteredTemplates.map(async (metadata) => {
        return await getContactListByName(metadata.ContactListName);
      })
    );

    const addContactList = [
      {
        ContactListName: 'sms-subscribers-list',
        Description: 'SMS subscribers list',
        LastUpdatedTimestamp: new Date(),
      },
      {
        ContactListName: 'email-subscribers-list',
        Description: 'Email subscribers list',
        LastUpdatedTimestamp: new Date(),
      },
      {
        ContactListName: 'one-signal-subscribers-list',
        Description: 'One Signal subscribers list',
        LastUpdatedTimestamp: new Date(),
      },
      {
        ContactListName: 'facebook-subscribers-list',
        Description: 'Facebook subscribers list',
        LastUpdatedTimestamp: new Date(),
      },
      {
        ContactListName: 'app-subscribers-list',
        Description: 'App subscribers list',
        LastUpdatedTimestamp: new Date(),
      },
    ];

    return [...contactLists, ...addContactList];
  } catch (error) {
    console.error('Error listing contact list:', error);
    toast.error('Failed to list contact list from AWS SES');
    throw error;
  }
};

// Create a new contact list
export const createContactList = async (
  data: CreateContactListInput
): Promise<CreateContactListResponse> => {
  const client = getSESClientV2();
  if (!client) throw new Error('No SES client available');

  try {
    const command = new CreateContactListCommand({
      ContactListName: data.ContactListName,
      Topics: data.Topics,
      Description: data.Description,
      Tags: data.Tags,
    });

    return await client.send(command);
  } catch (error) {
    console.error('Error creating contact list:', error);
    throw error;
  }
};

// Update an existing contact list
export const updateContactList = async (
  name: string,
  data: UpdateContactListInput
): Promise<ContactList> => {
  const client = getSESClientV2();
  if (!client) throw new Error('No SES client available');

  try {
    // Get existing contact list to merge with updates
    const contactList = await getContactListByName(name);
    if (!contactList) {
      throw new Error('Contact list not found');
    }

    // If contact list name or tags are changing, we need to create a new one and delete the old one
    if (
      data.ContactListName !== contactList.ContactListName ||
      JSON.stringify(data.Tags) !== JSON.stringify(contactList.Tags)
    ) {
      // ***TO REMEMBER***: In production mode, we should create the contact list and after delete it
      // Delete old contact list
      await deleteContactList(contactList.ContactListName);

      // Create new contact list with new name
      await createContactList({
        ContactListName: data.ContactListName || contactList.ContactListName,
        Topics: data.Topics || contactList.Topics,
        Description: data.Description || contactList.Description,
        Tags: data.Tags || contactList.Tags,
      });
    }

    // Otherwise, update the existing template
    const command = new UpdateContactListCommand({
      ContactListName: data.ContactListName,
      Topics: data.Topics || contactList.Topics,
      Description: data.Description || contactList.Description,
    });

    await client.send(command);

    // Return the updated template
    return {
      ...contactList,
      ...data,
    };
  } catch (error) {
    console.error(`Error updating template ${data.ContactListName}:`, error);
    toast.error(
      `Failed to update template "${data.ContactListName}" in AWS SES`
    );
    throw error;
  }
};

// Delete a contact list
export const deleteContactList = async (name: string): Promise<void> => {
  const client = getSESClientV2();
  if (!client) throw new Error('No SES client available');

  try {
    const command = new DeleteContactListCommand({
      ContactListName: name,
    });

    await client.send(command);
  } catch (error) {
    console.error(`Error deleting contact list ${name}:`, error);
    toast.error(`Failed to delete contact list "${name}" from AWS SES`);
    throw error;
  }
};
