import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'sonner';
import {
  SESv2Client,
  SendEmailCommand,
  ListContactListsCommand,
  GetContactListCommand,
  CreateContactListCommand,
  UpdateContactListCommand,
  DeleteContactListCommand,
} from '@aws-sdk/client-sesv2';
import {
  sendEmail,
  listContactList,
  getContactListByName,
  createContactList,
  updateContactList,
  deleteContactList,
} from '@/lib/aws-ses';

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
  s3BucketName: 'test-bucket',
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

      await expect(listContactList()).rejects.toThrow(
        'AWS credentials not found in storage.'
      );
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to initialize AWS V2 client. Please login again.'
      );
    });

    it('should throw an error when credentials are invalid JSON', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');

      await expect(listContactList()).rejects.toThrow(
        'Unexpected token \'i\', "invalid-json" is not valid JSON'
      );
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to initialize AWS V2 client. Please login again.'
      );
    });

    it('should initialize client with valid credentials', async () => {
      mockSESClient.send.mockResolvedValue({ ContactLists: [] });

      await listContactList();

      expect(SESv2Client).toHaveBeenCalledWith({
        region: mockCredentials.region,
        credentials: {
          accessKeyId: mockCredentials.accessKeyId,
          secretAccessKey: mockCredentials.secretAccessKey,
        },
      });
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockMessageId = 'message-123';
      mockSESClient.send.mockResolvedValue({ MessageId: mockMessageId });

      const result = await sendEmail(
        'sender@example.com',
        ['recipient@example.com'],
        'Test Subject',
        '<p>HTML content</p>',
        'Text content'
      );

      expect(result).toBe(mockMessageId);
      expect(mockSESClient.send).toHaveBeenCalledWith(
        expect.any(SendEmailCommand)
      );
    });

    it('should handle missing message id', async () => {
      mockSESClient.send.mockResolvedValue({});

      const result = await sendEmail(
        'sender@example.com',
        ['recipient@example.com'],
        'Test Subject',
        '<p>HTML content</p>',
        'Text content'
      );

      expect(result).toBe('');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('AWS Error');
      mockSESClient.send.mockRejectedValue(error);

      await expect(
        sendEmail(
          'sender@example.com',
          ['recipient@example.com'],
          'Test Subject',
          '<p>HTML content</p>',
          'Text content'
        )
      ).rejects.toThrow('AWS Error');
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
          `Failed to update contact list "${updateWithNewName.ContactListName}" in AWS SES`
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
          `Failed to update contact list "${updateWithNewName.ContactListName}" in AWS SES`
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
});
