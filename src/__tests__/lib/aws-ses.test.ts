import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import {
  SESv2Client,
  ListEmailTemplatesCommand,
  GetEmailTemplateCommand,
  CreateEmailTemplateCommand,
  UpdateEmailTemplateCommand,
  DeleteEmailTemplateCommand,
  SendEmailCommand,
  ListContactListsCommand,
  GetContactListCommand,
  CreateContactListCommand,
  UpdateContactListCommand,
  DeleteContactListCommand,
} from '@aws-sdk/client-sesv2';
import {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendTemplatedEmail,
  listContactList,
  getContactListByName,
  createContactList,
  updateContactList,
  deleteContactList,
} from '@/lib/aws-ses';
import type {
  EmailTemplate,
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
} from '@/types';

// Mock AWS SDK
vi.mock('@aws-sdk/client-sesv2');
vi.mock('sonner');

const mockSESClient = {
  send: vi.fn(),
};

const mockCredentials = {
  region: 'us-east-1',
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
};

describe('AWS SES Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify(mockCredentials)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock SESv2Client constructor
    vi.mocked(SESv2Client).mockImplementation(() => mockSESClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Client Initialization', () => {
    it('should throw an error when no credentials are stored', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      await expect(listTemplates()).rejects.toThrow(
        'AWS credentials not found in storage.'
      );
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to initialize AWS V2 client. Please login again.'
      );
    });

    it('should throw an error when credentials are invalid JSON', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');

      await expect(listTemplates()).rejects.toThrow(
        'Unexpected token \'i\', "invalid-json" is not valid JSON'
      );
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to initialize AWS V2 client. Please login again.'
      );
    });

    it('should initialize client with valid credentials', async () => {
      mockSESClient.send.mockResolvedValue({ TemplatesMetadata: [] });

      await listTemplates();

      expect(SESv2Client).toHaveBeenCalledWith({
        region: mockCredentials.region,
        credentials: {
          accessKeyId: mockCredentials.accessKeyId,
          secretAccessKey: mockCredentials.secretAccessKey,
        },
      });
    });
  });

  describe('Email Templates', () => {
    const mockTemplate = {
      TemplateName: 'test-template',
      TemplateContent: {
        Subject: 'Hello {{name}}',
        Html: '<p>Hello {{name}}, welcome to {{company}}!</p>',
        Text: 'Hello {{name}}, welcome to {{company}}!',
      },
    };

    const expectedTemplate: EmailTemplate = {
      id: 'test-template',
      TemplateName: 'test-template',
      Subject: 'Hello {{name}}',
      Html: '<p>Hello {{name}}, welcome to {{company}}!</p>',
      Text: 'Hello {{name}}, welcome to {{company}}!',
      dynamicFields: ['name', 'company'],
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    };

    describe('listTemplates', () => {
      it('should list all templates successfully', async () => {
        mockSESClient.send
          .mockResolvedValueOnce({
            TemplatesMetadata: [{ TemplateName: 'test-template' }],
          })
          .mockResolvedValueOnce(mockTemplate);

        const result = await listTemplates();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject(expectedTemplate);
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(ListEmailTemplatesCommand)
        );
      });

      it('should list an empty template successfully', async () => {
        const mockEmptyTemplate = {
          TemplateName: 'test-empty-template',
          TemplateContent: {
            Subject: '',
            Html: '',
            Text: '',
          },
        };
        const expectedEmptyTemplate: EmailTemplate = {
          id: 'test-empty-template',
          TemplateName: 'test-empty-template',
          Subject: '',
          Html: '',
          Text: '',
          dynamicFields: [],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        };

        mockSESClient.send
          .mockResolvedValueOnce({
            TemplatesMetadata: [{ TemplateName: 'test-empty-template' }],
          })
          .mockResolvedValueOnce(mockEmptyTemplate);

        const result = await listTemplates();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject(expectedEmptyTemplate);
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(ListEmailTemplatesCommand)
        );
      });

      it('should filter templates by search term', async () => {
        mockSESClient.send
          .mockResolvedValueOnce({
            TemplatesMetadata: [
              { TemplateName: 'welcome-template' },
              { TemplateName: 'newsletter-template' },
            ],
          })
          .mockResolvedValueOnce({
            ...mockTemplate,
            TemplateName: 'welcome-template',
          });

        const result = await listTemplates('welcome');

        expect(result).toHaveLength(1);
        expect(result[0].TemplateName).toBe('welcome-template');
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('AWS Error');
        mockSESClient.send.mockRejectedValue(error);

        await expect(listTemplates()).rejects.toThrow('AWS Error');
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to list templates from AWS SES'
        );
      });
    });

    describe('getTemplateById', () => {
      it('should get template by id successfully', async () => {
        mockSESClient.send.mockResolvedValue(mockTemplate);

        const result = await getTemplateById('test-template');

        expect(result).toMatchObject(expectedTemplate);
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(GetEmailTemplateCommand)
        );
      });

      it('should return undefined when template not found', async () => {
        mockSESClient.send.mockResolvedValue({});

        const result = await getTemplateById('non-existent');

        expect(result).toBeNull();
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('Template not found');
        mockSESClient.send.mockRejectedValue(error);

        await expect(getTemplateById('test-template')).rejects.toThrow(
          'Template not found'
        );
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to get template "test-template" from AWS SES'
        );
      });
    });

    describe('createTemplate', () => {
      const createInput: CreateEmailTemplateInput = {
        TemplateName: 'new-template',
        Subject: 'New Subject',
        Html: '<p>New HTML</p>',
        Text: 'New Text',
      };

      it('should create template successfully', async () => {
        mockSESClient.send.mockResolvedValue({});

        const result = await createTemplate(createInput);

        expect(result).toMatchObject({
          id: 'new-template',
          ...createInput,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(CreateEmailTemplateCommand)
        );
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('Creation failed');
        mockSESClient.send.mockRejectedValue(error);

        await expect(createTemplate(createInput)).rejects.toThrow(
          'Creation failed'
        );
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create template in AWS SES'
        );
      });
    });

    describe('updateTemplate', () => {
      const updateInput: UpdateEmailTemplateInput = {
        Subject: 'Updated Subject',
      };

      it('should update template successfully', async () => {
        // Mock getting existing template
        mockSESClient.send
          .mockResolvedValueOnce(mockTemplate)
          .mockResolvedValueOnce({});

        const result = await updateTemplate('test-template', updateInput);

        expect(result.Subject).toBe('Updated Subject');
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(UpdateEmailTemplateCommand)
        );
      });

      it('should handle template name change by creating new and deleting old', async () => {
        const updateWithNewName = {
          TemplateName: 'new-name',
          Subject: 'Updated',
        };

        // Mock: get existing, create new, delete old
        mockSESClient.send
          .mockResolvedValueOnce(mockTemplate) // get existing
          .mockResolvedValueOnce({}) // create new
          .mockResolvedValueOnce({}); // delete old

        const result = await updateTemplate('test-template', updateWithNewName);

        expect(result.TemplateName).toBe('new-name');
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(CreateEmailTemplateCommand)
        );
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(DeleteEmailTemplateCommand)
        );
      });

      it('should throw error when template not found', async () => {
        mockSESClient.send.mockResolvedValue({});

        await expect(
          updateTemplate('non-existent', updateInput)
        ).rejects.toThrow('Template not found');
      });
    });

    describe('deleteTemplate', () => {
      it('should delete template successfully', async () => {
        mockSESClient.send.mockResolvedValue({});

        await deleteTemplate('test-template');

        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(DeleteEmailTemplateCommand)
        );
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('Deletion failed');
        mockSESClient.send.mockRejectedValue(error);

        await expect(deleteTemplate('test-template')).rejects.toThrow(
          'Deletion failed'
        );
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to delete template "test-template" from AWS SES'
        );
      });
    });

    describe('sendTemplatedEmail', () => {
      it('should send templated email successfully', async () => {
        const mockMessageId = 'message-123';
        mockSESClient.send.mockResolvedValue({ MessageId: mockMessageId });

        const result = await sendTemplatedEmail(
          'test-template',
          'sender@example.com',
          ['recipient@example.com'],
          { name: 'John' }
        );

        expect(result).toBe(mockMessageId);
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(SendEmailCommand)
        );
      });

      it('should handle missing message id', async () => {
        mockSESClient.send.mockResolvedValue({});

        const result = await sendTemplatedEmail(
          'test-template',
          'sender@example.com',
          ['recipient@example.com']
        );

        expect(result).toBe('');
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('AWS Error');
        mockSESClient.send.mockRejectedValue(error);

        await expect(
          sendTemplatedEmail('test-template', 'sender@example.com', [
            'recipient@example.com',
          ])
        ).rejects.toThrow('AWS Error');
      });
    });
  });

  describe('Contact Lists', () => {
    const mockContactList = {
      ContactListName: 'test-list',
      Description: 'Test description',
      Topics: [{ TopicName: 'news', DefaultSubscriptionStatus: 'OPT_IN' }],
      Tags: [{ Key: 'env', Value: 'test' }],
    };

    describe('listContactList', () => {
      it('should list all contact lists successfully', async () => {
        mockSESClient.send
          .mockResolvedValueOnce({
            ContactLists: [{ ContactListName: 'test-list' }],
          })
          .mockResolvedValueOnce(mockContactList);

        const result = await listContactList();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject(mockContactList);
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(ListContactListsCommand)
        );
      });

      it('should filter contact lists by search term', async () => {
        mockSESClient.send
          .mockResolvedValueOnce({
            ContactLists: [
              { ContactListName: 'newsletter-list' },
              { ContactListName: 'welcome-list' },
            ],
          })
          .mockResolvedValueOnce({
            ...mockContactList,
            ContactListName: 'newsletter-list',
          });

        const result = await listContactList('newsletter');

        expect(result).toHaveLength(1);
        expect(result[0].ContactListName).toBe('newsletter-list');
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('AWS Error');
        mockSESClient.send.mockRejectedValue(error);

        await expect(listContactList('newsletter')).rejects.toThrow(
          'AWS Error'
        );
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to list contact list from AWS SES'
        );
      });
    });

    describe('getContactListByName', () => {
      it('should get contact list by name successfully', async () => {
        mockSESClient.send.mockResolvedValue(mockContactList);

        const result = await getContactListByName('test-list');

        expect(result).toMatchObject(mockContactList);
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(GetContactListCommand)
        );
      });
    });

    describe('createContactList', () => {
      it('should create contact list successfully', async () => {
        const createResponse = { ContactListName: 'new-list' };
        mockSESClient.send.mockResolvedValue(createResponse);

        const result = await createContactList({
          ContactListName: 'new-list',
          Description: 'New list',
        });

        expect(result).toEqual(createResponse);
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(CreateContactListCommand)
        );
      });

      it('should handle errors gracefully', async () => {
        const error = new Error('AWS Error');
        mockSESClient.send.mockRejectedValue(error);

        await expect(
          createContactList({
            ContactListName: 'new-list',
            Description: 'New list',
          })
        ).rejects.toThrow('AWS Error');
      });
    });

    describe('updateContactList', () => {
      it('should update contact list successfully', async () => {
        // Mock: get existing, update
        mockSESClient.send
          .mockResolvedValueOnce(mockContactList)
          .mockResolvedValueOnce({});

        const result = await updateContactList('test-list', {
          Description: 'Updated description',
        });

        expect(result.Description).toBe('Updated description');
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(UpdateContactListCommand)
        );
      });

      it('should handle name change by deleting old and creating new', async () => {
        const updateWithNewName = { ContactListName: 'new-name' };

        // Mock: get existing, delete old, create new
        mockSESClient.send
          .mockResolvedValueOnce(mockContactList) // get existing
          .mockResolvedValueOnce({}) // delete old
          .mockResolvedValueOnce({}); // create new

        await updateContactList('test-list', updateWithNewName);

        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(DeleteContactListCommand)
        );
        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(CreateContactListCommand)
        );
      });

      it('should handle error if contact list is not found', async () => {
        const updateWithNewName = { ContactListName: 'new-name' };
        mockSESClient.send.mockResolvedValueOnce(null);

        await expect(
          updateContactList('test-list', updateWithNewName)
        ).rejects.toThrow('Contact list not found');
        expect(toast.error).toHaveBeenCalledWith(
          `Failed to update template "${updateWithNewName.ContactListName}" in AWS SES`
        );
      });

      it('should handle errors gracefully', async () => {
        const updateWithNewName = { ContactListName: 'new-name' };
        const error = new Error('AWS Error');
        mockSESClient.send.mockRejectedValue(error);

        await expect(
          updateContactList('test-list', updateWithNewName)
        ).rejects.toThrow('AWS Error');
        expect(toast.error).toHaveBeenCalledWith(
          `Failed to update template "${updateWithNewName.ContactListName}" in AWS SES`
        );
      });
    });

    describe('deleteContactList', () => {
      it('should delete contact list successfully', async () => {
        mockSESClient.send.mockResolvedValue({});

        await deleteContactList('test-list');

        expect(mockSESClient.send).toHaveBeenCalledWith(
          expect.any(DeleteContactListCommand)
        );
      });

      it('should handle errors gracefully', async () => {
        const contactListToDelete = 'test-list';
        const error = new Error('AWS Error');
        mockSESClient.send.mockRejectedValue(error);

        await expect(deleteContactList(contactListToDelete)).rejects.toThrow(
          'AWS Error'
        );
        expect(toast.error).toHaveBeenCalledWith(
          `Failed to delete contact list "${contactListToDelete}" from AWS SES`
        );
      });
    });
  });

  describe('Dynamic Fields Extraction', () => {
    it('should extract dynamic fields from template content', async () => {
      const templateWithFields = {
        TemplateName: 'test-template',
        TemplateContent: {
          Subject: 'Hello {{firstName}} {{lastName}}',
          Html: '<p>Welcome {{firstName}} to {{company.name}}!</p>',
          Text: 'Your order {{order.id}} is ready',
        },
      };

      mockSESClient.send
        .mockResolvedValueOnce({
          TemplatesMetadata: [{ TemplateName: 'test-template' }],
        })
        .mockResolvedValueOnce(templateWithFields);

      const result = await listTemplates();

      expect(result[0].dynamicFields).toEqual([
        'firstName',
        'lastName',
        'order.id',
        'company.name',
      ]);
    });

    it('should handle templates without dynamic fields', async () => {
      const templateWithoutFields = {
        TemplateName: 'static-template',
        TemplateContent: {
          Subject: 'Static Subject',
          Html: '<p>Static content</p>',
          Text: 'Static text',
        },
      };

      mockSESClient.send
        .mockResolvedValueOnce({
          TemplatesMetadata: [{ TemplateName: 'static-template' }],
        })
        .mockResolvedValueOnce(templateWithoutFields);

      const result = await listTemplates();

      expect(result[0].dynamicFields).toEqual([]);
    });
  });
});
