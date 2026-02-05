import { Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';

export function FormActions({
  form,
  loading,
  isEditing,
  handleSubmit,
  handleDelete,
  handleNavigation
}) {
  const navigate = useNavigate();

  // Use custom navigation handler if provided, otherwise use default navigate
  const navigateHandler = handleNavigation || navigate;

  const validateAndSubmit = (publicationStatus, skipValidation = false) => {
    // Skip validation for unpublishing or when explicitly requested
    if (!skipValidation) {
      form.validate();
      if (Object.keys(form.errors).length > 0) {
        notifications.show({
          title: 'Form Validation Error',
          message: `Please fix the errors in the form before ${publicationStatus === 'draft' ? 'saving draft' : 'publishing'}`,
          color: 'red',
          autoClose: 5000
        });
        return;
      }
    }
    form.onSubmit((values) => handleSubmit(values, publicationStatus))();
  };

  return (
    <Group justify="center" mt="xl">
      <Button
        size="lg"
        variant="light"
        loading={loading}
        onClick={() => validateAndSubmit('draft')}
        loaderProps={{ type: 'dots' }}
      >
        {loading ? 'Saving...' : 'Save Draft'}
      </Button>

      <Button
        size="lg"
        loading={loading}
        onClick={() => validateAndSubmit('published')}
        loaderProps={{ type: 'dots' }}
      >
        {loading ?
          (isEditing && form.values.publication_status === 'published' ? 'Updating...' : 'Publishing...') :
          (isEditing && form.values.publication_status === 'published' ? 'Update' : 'Publish')
        }
      </Button>

      {isEditing && form.values.publication_status === 'published' && (
        <Button
          size="lg"
          variant="outline"
          color="orange"
          loading={loading}
          onClick={() => validateAndSubmit('draft', true)}
          loaderProps={{ type: 'dots' }}
        >
          {loading ? 'Unpublishing...' : 'Unpublish'}
        </Button>
      )}

      {isEditing && (
        <Button
          size="lg"
          color="red"
          variant="outline"
          loading={loading}
          onClick={handleDelete}
          disabled={loading}
          loaderProps={{ type: 'dots' }}
        >
          {loading ? 'Deleting...' : 'Delete POI'}
        </Button>
      )}

      <Button
        size="lg"
        variant="default"
        onClick={() => navigateHandler('/')}
        disabled={loading}
      >
        Cancel
      </Button>
    </Group>
  );
}