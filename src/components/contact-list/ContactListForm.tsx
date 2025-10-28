import { useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useContactListForm } from '@/hooks/useContactListForm';
import TemplateFormSkeleton from '../TemplateFormSkeleton';
import DeleteContactListDialog from './DeleteContactListDialog';
import ListTopics from './ListTopics';
import TopicForm from './TopicForm';
import ListTags from './ListTags';
import TagForm from './TagForm';

const ContactListForm: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const {
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
  } = useContactListForm({ name });

  if (!isLoggedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <TemplateFormSkeleton
        title="Loading contact lists"
        onBack={() => navigate('/')}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/contact-lists')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1>{isEditing ? 'Edit' : 'Create'} Contact List</h1>
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

      <div className="grid grid-cols-1 gap-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ContactListName">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="ContactListName"
                      name="ContactListName"
                      value={formData.ContactListName}
                      onChange={handleChange}
                      className={`mt-2 ${
                        errors.ContactListName ? 'border-destructive' : ''
                      }`}
                    />
                    {errors.ContactListName && (
                      <p className="text-sm text-destructive">
                        {errors.ContactListName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Description">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="Description"
                      name="Description"
                      value={formData.Description}
                      onChange={handleChange}
                      rows={3}
                      className={`mt-2 ${
                        errors.Description ? 'border-destructive' : ''
                      }`}
                    />
                    {errors.Description && (
                      <p className="text-sm text-destructive">
                        {errors.Description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="TagKey">Tags</Label>
                    <TagForm tags={formData.Tags} handleChange={handleChange} />
                    <ListTags
                      tags={formData.Tags}
                      handleChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Topics</Label>
                    <TopicForm
                      topics={formData.Topics}
                      handleChange={handleChange}
                    />
                    <ListTopics
                      topics={formData.Topics}
                      handleChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mr-2 px-6"
              onClick={() => navigate('/contact-lists')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Contact List
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {isEditing && (
        <DeleteContactListDialog
          isOpen={showDeleteDialog}
          contactListName={formData.ContactListName}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={handleDelete}
        />
      )}
    </div>
  );
};

export default ContactListForm;
