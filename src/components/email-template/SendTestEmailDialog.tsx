import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendTemplatedEmail } from '@/lib/aws-ses';

interface SendTestEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  dynamicFields: string[];
}

const SendTestEmailDialog: React.FC<SendTestEmailDialogProps> = ({
  isOpen,
  onClose,
  templateName,
  dynamicFields,
}) => {
  const [fromEmail, setFromEmail] = useState<string>('');
  const [toEmails, setToEmails] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [listDynamicFields, setListDynamicFields] = useState({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setListDynamicFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSend = async () => {
    if (!fromEmail.trim()) {
      toast.error('Please enter a sender email address');
      return;
    }

    if (!toEmails.trim()) {
      toast.error('Please enter at least one recipient email address');
      return;
    }

    // Check if email format is valid (simple validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      toast.error('Please enter a valid sender email address');
      return;
    }

    const recipients = toEmails.split(',').map((email) => email.trim());
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }

    setIsSending(true);

    try {
      const messageId = await sendTemplatedEmail(
        templateName,
        fromEmail,
        recipients,
        listDynamicFields
      );

      toast.success(`Email sent successfully! Message ID: ${messageId}`);
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Failed to send email:', error);

      // Handle specific AWS SES errors
      if (error.name === 'MessageRejected') {
        toast.error(
          'Email rejected: Your account may be in sandbox mode. Verify your sending limits and that recipient emails are verified.'
        );
      } else {
        toast.error(
          `Failed to send email: ${error.message || 'Unknown error'}`
        );
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email using the template "{templateName}".{' '}
          </DialogDescription>
          <DialogDescription className="text-amber-500">
            Note: In SES sandbox mode, both sender and recipient emails must be
            verified.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fromEmail">From (Sender Email)</Label>
            <Input
              id="fromEmail"
              type="text"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="sender@example.com"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="toEmails">
              To (Recipient Emails, comma separated)
            </Label>
            <Input
              id="toEmails"
              type="text"
              value={toEmails}
              onChange={(e) => setToEmails(e.target.value)}
              placeholder="recipient1@example.com, recipient2@example.com"
            />
          </div>

          <div className="grid gap-2">
            <DialogHeader>
              <DialogTitle className="text-sm">
                Template replacement tags
              </DialogTitle>
            </DialogHeader>

            {dynamicFields.map((field) => (
              <div
                key={field}
                className="grid grid-cols-3 items-center gap-4 mx-4"
              >
                <Label htmlFor={field}>{field}</Label>
                <Input
                  id={field}
                  className="col-span-2"
                  name={field}
                  type="text"
                  value={listDynamicFields[field] || ''}
                  onChange={handleInputChange}
                  placeholder={`Enter ${field}`}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            className="gap-0"
            size="sm"
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <SendHorizontal className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendTestEmailDialog;
