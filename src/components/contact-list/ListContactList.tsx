import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, FileText, PlusCircle, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContactList } from '@/types';
import { listContactList } from '@/lib/aws-ses';
import ContactListItem from './ContactListItem';

const ListContactList: React.FC = () => {
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const credentials = localStorage.getItem('awsCredentials');
    setIsLoggedIn(Boolean(credentials));
  }, [navigate]);

  const loadContactList = async () => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await listContactList(searchTerm);
      setContactLists(data);
    } catch (error) {
      console.error('Failed to load contact list:', error);
      toast.error('Failed to load contact list from AWS SES');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContactList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isLoggedIn]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onListContactDeleted = () => {
    loadContactList();
  };

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Login Required</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          You need to log in with your AWS credentials to view and manage SES
          email contact list.
        </p>
        <Button onClick={() => navigate('/login')}>
          <LogIn className="mr-2 h-4 w-4" />
          Login with AWS Credentials
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1>Contact Lists</h1>
        <Link to="/contact-lists/new">
          <Button className="gap-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Contact List
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contact list..."
          className="pl-10"
          value={searchTerm}
          onChange={handleSearchChange}
          name="search"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border rounded-lg p-6 h-[200px] animate-pulse bg-muted"
            />
          ))}
        </div>
      ) : contactLists && contactLists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {contactLists.map((contact) => (
            <ContactListItem
              contactList={contact}
              key={contact.ContactListName}
              onDeleted={onListContactDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No contact list found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? 'No contact list match your search criteria'
              : 'Create your first email template to get started'}
          </p>
          <Link to="/contact-lists/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Contact List
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ListContactList;
