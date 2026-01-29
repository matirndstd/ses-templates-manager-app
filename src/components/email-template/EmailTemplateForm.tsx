import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteTemplateDialog from '@/components/email-template/DeleteTemplateDialog';
import EmailPreview from '@/components/email-template/EmailPreview';
import TemplateDetailsForm from '@/components/email-template/TemplateDetailsForm';
import TemplateFormSkeleton from '@/components/TemplateFormSkeleton';
import { useTemplateForm } from '@/hooks/useTemplateForm';
import { parseContent } from '@/lib/utils';

const EmailTemplateForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || undefined;

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
            <Button
              variant="outline"
              className="text-destructive gap-0"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <TemplateDetailsForm
            formData={parsedFormData}
            errors={errors}
            tab={tab}
            isEditing={isEditing}
            handleChange={handleChange}
            handleHtmlChange={handleHtmlChange}
            setTab={setTab}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mr-2 px-6"
              onClick={() => navigate('/templates')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="gap-0"
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
        <DeleteTemplateDialog
          isOpen={showDeleteDialog}
          templateId={id}
          templateName={parsedFormData.TemplateName || ''}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={handleDelete}
        />
      )}
    </div>
  );
};

export default EmailTemplateForm;
