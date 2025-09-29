import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteContactList } from '@/lib/aws-ses';
import { useToast } from '@/components/ui/use-toast';

interface DeleteContactListDialogProps {
  isOpen: boolean;
  contactListName: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteContactListDialog: React.FC<DeleteContactListDialogProps> = ({
  isOpen,
  contactListName,
  onClose,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteContactList(contactListName);
      toast({
        title: 'Success',
        description: `Contact list "${contactListName}" has been deleted.`,
      });
      onDeleted();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete the contact list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Contact List
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the contact list{' '}
            <strong>"{contactListName}"</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteContactListDialog;
