import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { validateS3Connection } from '@/lib/aws-s3';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from './ui/select';
import { AWS_REGIONS } from '@/lib/constants';

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onOpenChange }) => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
    s3BucketName: '',
    s3FolderPrefix: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      toast.error('Please enter your AWS credentials');
      return;
    }
    if (!credentials.s3BucketName) {
      toast.error('Please enter your S3 bucket name');
      return;
    }
    setIsLoggingIn(true);

    try {
      // Verify credentials by testing S3 bucket connection
      const isValid = await validateS3Connection(
        credentials.region,
        credentials.accessKeyId,
        credentials.secretAccessKey,
        credentials.s3BucketName,
        credentials.s3FolderPrefix
      );

      if (!isValid) {
        throw new Error('Invalid credentials or bucket access');
      }

      // Store in localStorage (not secure for real AWS credentials!)
      localStorage.setItem('awsCredentials', JSON.stringify(credentials));

      toast.success('Successfully logged in');
      onOpenChange(false);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials, bucket name, and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to SES Templates Manager</DialogTitle>
          <DialogDescription>
            Enter your AWS credentials and S3 bucket name to manage email templates.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="region">AWS Region</Label>
            <Select
              name="region"
              value={credentials.region}
              onValueChange={(value) => {
                setCredentials((prev) => ({ ...prev, region: value }));
              }}
            >
              <SelectTrigger
                id="region"
                aria-label="region"
                data-testid="select-region"
              >
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {AWS_REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accessKeyId">Access Key ID</Label>
            <Input
              id="accessKeyId"
              name="accessKeyId"
              value={credentials.accessKeyId}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="secretAccessKey">Secret Access Key</Label>
            <Input
              id="secretAccessKey"
              name="secretAccessKey"
              type="password"
              value={credentials.secretAccessKey}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="s3BucketName">S3 Bucket Name</Label>
            <Input
              id="s3BucketName"
              name="s3BucketName"
              placeholder="my-ses-templates-bucket"
              value={credentials.s3BucketName}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="s3FolderPrefix">S3 Folder Prefix</Label>
            <Input
              id="s3FolderPrefix"
              name="s3FolderPrefix"
              placeholder="root_folder/"
              value={credentials.s3FolderPrefix}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleLogin} disabled={isLoggingIn}>
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
