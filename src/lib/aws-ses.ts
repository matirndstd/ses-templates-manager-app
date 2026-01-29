import {
  SESv2Client,
  ListContactListsCommand,
  CreateContactListCommand,
  CreateContactListResponse,
  GetContactListCommand,
  UpdateContactListCommand,
  DeleteContactListCommand,
  SendEmailCommand,
} from '@aws-sdk/client-sesv2';
import {
  ContactList,
  CreateContactListInput,
  UpdateContactListInput,
} from '@/types';
import { toast } from 'sonner';

// Initialize SES V2 client with credentials from localStorage
const getSESClientV2 = (): SESv2Client | null => {
  try {
    const storedCredentials = localStorage.getItem('awsCredentials');
    if (!storedCredentials) {
      throw new Error('AWS credentials not found in storage.');
    }

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
    throw error;
  }
};

// Send an email using raw content (no longer uses SES templates)
export const sendEmail = async (
  fromEmail: string,
  recipients: string[],
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<string> => {
  try {
    const client = getSESClientV2();
    const command = new SendEmailCommand({
      FromEmailAddress: fromEmail,
      Destination: {
        ToAddresses: recipients,
      },
      Content: {
        Simple: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textContent,
              Charset: 'UTF-8',
            },
          },
        },
      },
    });

    const response = await client.send(command);
    return response.MessageId || '';
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Get a single contact list by name (ContactListName)
export const getContactListByName = async (
  name: string
): Promise<ContactList | undefined> => {
  try {
    const client = getSESClientV2();
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
  try {
    const client = getSESClientV2();
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

    return contactLists;
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
  try {
    const client = getSESClientV2();
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
  try {
    const client = getSESClientV2();
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
    console.error(`Error updating contact list ${data.ContactListName}:`, error);
    toast.error(
      `Failed to update contact list "${data.ContactListName}" in AWS SES`
    );
    throw error;
  }
};

// Delete a contact list
export const deleteContactList = async (name: string): Promise<void> => {
  try {
    const client = getSESClientV2();
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
