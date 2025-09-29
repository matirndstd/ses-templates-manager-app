import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, MoreVertical, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContactList } from '@/types';
import DeleteContactListDialog from './DeleteContactListDialog';

interface ContactListItemProps {
  contactList: ContactList;
  onDeleted: () => void;
}

const ContactListItem: React.FC<ContactListItemProps> = ({
  contactList,
  onDeleted,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle
              className="text-lg truncate"
              title={contactList.ContactListName}
            >
              {contactList.ContactListName}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link to={`/contact-lists/${contactList.ContactListName}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <Link to={`/contact-lists/${contactList.ContactListName}`}>
          <CardContent className="pb-2">
            <p
              className="text-sm text-muted-foreground mb-2 truncate"
              title={contactList.Description}
            >
              {contactList.Description}
            </p>
          </CardContent>
        </Link>
        <CardFooter className="flex-col items-start py-2 px-6 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar aria-hidden="true" className="h-3 w-3 mr-1" />
            <span>
              Updated {formatDate(new Date(contactList.LastUpdatedTimestamp))}
            </span>
          </div>
        </CardFooter>
      </Card>

      <DeleteContactListDialog
        isOpen={showDeleteDialog}
        contactListName={contactList.ContactListName}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={onDeleted}
      />
    </>
  );
};

export default ContactListItem;
