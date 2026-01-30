import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import z from 'zod/v4';
import { EmailTemplate } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { createTemplate, getTemplateById, updateTemplate } from '@/lib/aws-s3';
import { CreateTemplateSchema } from '@/schemas';

interface UseTemplateFormProps {
  id?: string;
}

export const useTemplateForm = ({ id }: UseTemplateFormProps) => {
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [tab, setTab] = useState<string>('html');

  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    TemplateName: '',
    Subject: '',
    Html: '',
    Text: '',
    dynamicFields: [],
  });

  useEffect(() => {
    const credentials = localStorage.getItem('awsCredentials');
    const loggedIn = !!credentials;
    setIsLoggedIn(loggedIn);

    if (!loggedIn) {
      toast({
        title: 'Login Required',
        description: 'You need to log in to manage templates',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (isEditing && id) {
      loadTemplate(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing, navigate]);

  const loadTemplate = async (templateId: string) => {
    try {
      setIsLoading(true);
      const template = await getTemplateById(templateId);
      if (!template) {
        toast({
          title: 'Error',
          description: 'Template not found',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setFormData({
        TemplateName: template.TemplateName,
        Subject: template.Subject,
        Html: template.Html,
        Text: template.Text,
        dynamicFields: template.dynamicFields,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleHtmlChange = (code: string) => {
    setFormData((prev) => ({ ...prev, Html: code }));

    if (errors.Html) {
      setErrors((prev) => ({ ...prev, Html: '' }));
    }
  };

  const validate = () => {
    const result = CreateTemplateSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = z.treeifyError(result.error).properties;
      if (fieldErrors.Html?.errors[0] && tab !== 'html') {
        setTab('html');
      } else if (fieldErrors.Text?.errors[0] && tab !== 'text') {
        setTab('text');
      }

      setErrors({
        TemplateName: fieldErrors.TemplateName?.errors[0],
        Subject: fieldErrors.Subject?.errors[0],
        Html: fieldErrors.Html?.errors[0],
        Text: fieldErrors.Text?.errors[0],
      });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      if (isEditing && id) {
        await updateTemplate(id, formData);
        toast({
          title: 'Success',
          description: `Template "${formData.TemplateName}" has been updated`,
        });
      } else {
        await createTemplate(
          formData as Required<
            Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
          >
        );
        toast({
          title: 'Success',
          description: `Template "${formData.TemplateName}" has been created`,
        });
      }

      navigate('/templates');
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    navigate('/');
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return {
    isEditing,
    isLoading,
    isSaving,
    isLoggedIn,
    formData,
    errors,
    showDeleteDialog,
    showPreview,
    tab,
    setShowDeleteDialog,
    togglePreview,
    handleChange,
    handleHtmlChange,
    handleSubmit,
    handleDelete,
    navigate,
    setTab,
  };
};
