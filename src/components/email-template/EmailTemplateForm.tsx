import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteTemplateDialog from './DeleteTemplateDialog';
import SendTestEmailDialog from './SendTestEmailDialog';
import EmailPreview from './EmailPreview';
import TemplateDetailsForm from './TemplateDetailsForm';
import TemplateFormSkeleton from '../TemplateFormSkeleton';
import { useTemplateForm } from '@/hooks/useTemplateForm';
import { parseContent } from '@/lib/utils';

const EmailTemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showSendEmailDialog, setShowSendEmailDialog] = React.useState(false);

  const {
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
  } = useTemplateForm({ id });

  if (!isLoggedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <TemplateFormSkeleton
        title="Loading template..."
        onBack={() => navigate('/')}
      />
    );
  }

  const parsedFormData = {
    ...formData,
    Subject: parseContent(formData.Subject),
    Html: parseContent(formData.Html),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/templates')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1>{isEditing ? 'Edit Template' : 'Create Template'}</h1>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowSendEmailDialog(true)}
                disabled={isSaving}
              >
                <SendHorizontal className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>

              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <TemplateDetailsForm
            formData={parsedFormData}
            errors={errors}
            handleChange={handleChange}
            handleHtmlChange={handleHtmlChange}
            tab={tab}
            setTab={setTab}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={() => navigate('/templates')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                !parsedFormData.TemplateName ||
                !parsedFormData.Subject ||
                !parsedFormData.Html
              }
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <EmailPreview
            template={parsedFormData}
            isVisible={showPreview}
            onToggleVisibility={togglePreview}
          />
        </div>
      </div>

      {isEditing && (
        <>
          <DeleteTemplateDialog
            isOpen={showDeleteDialog}
            templateId={id!}
            templateName={parsedFormData.TemplateName || ''}
            onClose={() => setShowDeleteDialog(false)}
            onDeleted={handleDelete}
          />

          <SendTestEmailDialog
            isOpen={showSendEmailDialog}
            onClose={() => setShowSendEmailDialog(false)}
            templateName={id!}
            dynamicFields={parsedFormData.dynamicFields}
          />
        </>
      )}
    </div>
  );
};

export default EmailTemplateForm;
