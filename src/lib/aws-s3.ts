import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  EmailTemplate,
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
} from '@/types';
import { toast } from 'sonner';

interface AWSCredentials {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  s3BucketName: string;
  s3FolderPrefix?: string;
}

// Get credentials from localStorage
const getCredentials = (): AWSCredentials | null => {
  try {
    const storedCredentials = localStorage.getItem('awsCredentials');
    if (!storedCredentials) {
      return null;
    }
    return JSON.parse(storedCredentials);
  } catch (error) {
    console.error('Error parsing credentials:', error);
    return null;
  }
};

// Initialize S3 client with credentials from localStorage
const getS3Client = (): S3Client | null => {
  try {
    const credentials = getCredentials();
    if (!credentials) {
      throw new Error('AWS credentials not found in storage.');
    }

    const { region, accessKeyId, secretAccessKey } = credentials;

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } catch (error) {
    console.error('Error initializing S3 client:', error);
    toast.error('Failed to initialize AWS S3 client. Please login again.');
    throw error;
  }
};

// Get the S3 bucket name from credentials
const getBucketName = (): string => {
  const credentials = getCredentials();
  if (!credentials?.s3BucketName) {
    throw new Error('S3 bucket name not found in credentials.');
  }
  return credentials.s3BucketName;
};

// This function is used to extract dynamic fields from the template content
const getDynamicFields = (contentStr: string): string[] => {
  if (!contentStr) return [];

  const dynamicFieldsArr: string[] = [];
  const regex = /{{\s*([\w.]+)\s*}}/g;
  let match;

  // Use exec() in a loop to find all matches in the string.
  // The loop continues as long as exec() finds a match.
  while ((match = regex.exec(contentStr)) !== null) {
    dynamicFieldsArr.push(match[1]);
  }

  return dynamicFieldsArr;
};

// Template file structure stored in S3
interface S3TemplateContent {
  TemplateName?: string;
  TemplateContent: {
    Subject?: string;
    Html?: string;
    Text?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Convert S3 template to our app's template format
const convertToAppTemplate = (
  content: S3TemplateContent,
  id: string
): EmailTemplate => {
  const { Subject, Text, Html } = content.TemplateContent || {};

  let dynamicFieldsArr: string[] = [];
  dynamicFieldsArr = [...dynamicFieldsArr, ...getDynamicFields(Subject)];
  dynamicFieldsArr = [...dynamicFieldsArr, ...getDynamicFields(Text)];
  dynamicFieldsArr = [...dynamicFieldsArr, ...getDynamicFields(Html)];
  dynamicFieldsArr = Array.from(new Set(dynamicFieldsArr));

  return {
    id,
    TemplateName: content.TemplateName || '',
    Subject: Subject || '',
    Html: Html || '',
    Text: Text || '',
    dynamicFields: dynamicFieldsArr || [],
    createdAt: content.createdAt ? new Date(content.createdAt) : new Date(),
    updatedAt: content.updatedAt ? new Date(content.updatedAt) : new Date(),
  };
};

// Get the template file key (filename) from template name
const getTemplateKey = (templateName: string): string => {
  return `${templateName}.json`;
};

// List all templates with optional filtering
export const listTemplates = async (
  searchTerm?: string
): Promise<EmailTemplate[]> => {
  try {
    const client = getS3Client();
    const bucketName = getBucketName();
    const folderPrefix = getCredentials()?.s3FolderPrefix || '';

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
      Prefix: folderPrefix
    });

    const response = await client.send(command);
    const objects = response.Contents || [];

    // Filter only .json files
    const jsonFiles = objects.filter((obj) => obj.Key?.endsWith('.json'));

    // Filter by search term if provided
    const filteredFiles = searchTerm
      ? jsonFiles.filter((obj) =>
          obj.Key?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : jsonFiles;

    // For each file, fetch the full template content
    const templates = await Promise.all(
      filteredFiles.map(async (obj) => {
        if (!obj.Key) return undefined;
        const templateName = obj.Key.replace('.json', '');
        return await getTemplateById(templateName);
      })
    );

    return templates.filter((template): template is EmailTemplate => !!template);
  } catch (error) {
    console.error('Error listing templates:', error);
    toast.error('Failed to list templates from S3 bucket');
    throw error;
  }
};

// Get a single template by ID (TemplateName)
export const getTemplateById = async (
  id: string
): Promise<EmailTemplate | undefined> => {
  try {
    const client = getS3Client();
    const bucketName = getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: getTemplateKey(id),
    });

    const response = await client.send(command);

    if (!response.Body) {
      return undefined;
    }

    // Convert the stream to string
    const bodyContents = await response.Body.transformToString();
    const templateContent: S3TemplateContent = JSON.parse(bodyContents);

    return convertToAppTemplate(templateContent, id);
  } catch (error) {
    // If the object doesn't exist, return undefined instead of throwing
    if ((error as { name?: string }).name === 'NoSuchKey') {
      return undefined;
    }
    console.error(`Error getting template ${id}:`, error);
    toast.error(`Failed to get template "${id}" from S3 bucket`);
    throw error;
  }
};

// Create a new template
export const createTemplate = async (
  data: CreateEmailTemplateInput
): Promise<EmailTemplate> => {
  try {
    const client = getS3Client();
    const bucketName = getBucketName();

    const now = new Date().toISOString();
    const templateContent: S3TemplateContent = {
      TemplateName: data.TemplateName,
      TemplateContent: {
        Subject: data.Subject,
        Html: data.Html,
        Text: data.Text,
      },
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: getTemplateKey(data.TemplateName),
      Body: JSON.stringify(templateContent, null, 2),
      ContentType: 'application/json',
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
    toast.error('Failed to create template in S3 bucket');
    throw error;
  }
};

// Update an existing template
export const updateTemplate = async (
  id: string,
  data: UpdateEmailTemplateInput
): Promise<EmailTemplate> => {
  try {
    const client = getS3Client();
    const bucketName = getBucketName();

    // Get existing template to merge with updates
    const existingTemplate = await getTemplateById(id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    const now = new Date().toISOString();

    // If template name is changing, we need to create a new one and delete the old one
    if (data.TemplateName && data.TemplateName !== id) {
      const newTemplateContent: S3TemplateContent = {
        TemplateName: data.TemplateName,
        TemplateContent: {
          Subject: data.Subject || existingTemplate.Subject,
          Html: data.Html || existingTemplate.Html,
          Text: data.Text || existingTemplate.Text,
        },
        createdAt: existingTemplate.createdAt.toISOString(),
        updatedAt: now,
      };

      // Create new template with new name
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: getTemplateKey(data.TemplateName),
        Body: JSON.stringify(newTemplateContent, null, 2),
        ContentType: 'application/json',
      });

      await client.send(putCommand);

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
    const updatedTemplateContent: S3TemplateContent = {
      TemplateName: id,
      TemplateContent: {
        Subject: data.Subject || existingTemplate.Subject,
        Html: data.Html || existingTemplate.Html,
        Text: data.Text || existingTemplate.Text,
      },
      createdAt: existingTemplate.createdAt.toISOString(),
      updatedAt: now,
    };

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: getTemplateKey(id),
      Body: JSON.stringify(updatedTemplateContent, null, 2),
      ContentType: 'application/json',
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
    toast.error(`Failed to update template "${id}" in S3 bucket`);
    throw error;
  }
};

// Delete a template
export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    const client = getS3Client();
    const bucketName = getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: getTemplateKey(id),
    });

    await client.send(command);
  } catch (error) {
    console.error(`Error deleting template ${id}:`, error);
    toast.error(`Failed to delete template "${id}" from S3 bucket`);
    throw error;
  }
};

// Validate S3 bucket connection (used for login verification)
export const validateS3Connection = async (
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucketName: string,
  s3FolderPrefix?: string
): Promise<boolean> => {
  try {
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Try to list objects to verify bucket access
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1,
      Prefix: s3FolderPrefix || '',
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('S3 connection validation failed:', error);
    return false;
  }
};
