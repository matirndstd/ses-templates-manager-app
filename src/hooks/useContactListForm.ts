import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import z from 'zod/v4';
import { ContactList } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import {
  createContactList,
  getContactListByName,
  updateContactList,
} from '@/lib/aws-ses';
import { CreateContactListSchema } from '@/schemas';

interface UseContactListFormProps {
  name?: string;
}

export const useContactListForm = ({ name }: UseContactListFormProps) => {
  const isEditing = Boolean(name);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [formData, setFormData] = useState<ContactList>({
    ContactListName: '',
    Description: '',
    Topics: [],
    Tags: [],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

    if (isEditing && name) {
      loadContactList(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isEditing, navigate]);

  const loadContactList = async (contactListName: string) => {
    try {
      setIsLoading(true);
      const contactList = await getContactListByName(contactListName);
      if (!contactList) {
        toast({
          title: 'Error',
          description: `Contact list "${contactListName}" not found`,
          variant: 'destructive',
        });
        navigate('/contact-lists');
        return;
      }

      setFormData({
        ContactListName: contactList.ContactListName,
        Description: contactList.Description,
        Topics: contactList.Topics,
        Tags: contactList.Tags,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to load "${contactListName}" contact list`,
        variant: 'destructive',
      });
      navigate('/contact-lists');
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

  const validate = () => {
    const result = CreateContactListSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = z.treeifyError(result.error).properties;
      setErrors({
        ContactListName: fieldErrors.ContactListName?.errors[0],
        Description: fieldErrors.Description?.errors[0],
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
      if (isEditing && name) {
        await updateContactList(name, formData);
        toast({
          title: 'Success',
          description: `Contact list "${formData.ContactListName}" has been updated`,
        });
      } else {
        await createContactList(formData);
        toast({
          title: 'Success',
          description: `Contact list "${formData.ContactListName}" has been created`,
        });
      }

      navigate('/contact-lists');
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to save contact list',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    navigate('/');
  };

  return {
    isEditing,
    isLoading,
    isSaving,
    isLoggedIn,
    formData,
    errors,
    showDeleteDialog,
    setShowDeleteDialog,
    handleChange,
    handleSubmit,
    handleDelete,
    navigate,
  };
};
