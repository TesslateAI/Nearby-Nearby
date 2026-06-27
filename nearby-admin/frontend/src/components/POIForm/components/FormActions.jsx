import { Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { validateAccessibleParking } from '../constants/validationRules';

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
      form.clearErrors();
      form.validate();

      // Accessible Parking ADA sub-options are required once "Accessible Parking"
      // is selected. Enforced on Publish/Update only — drafts may stay incomplete.
      const parkingErrors =
        publicationStatus === 'published' ? validateAccessibleParking(form.values) : {};
      const hasParkingErrors = Object.keys(parkingErrors).length > 0;
      if (hasParkingErrors) {
        form.setErrors({ ...form.errors, ...parkingErrors });
      }

      if (Object.keys(form.errors).length > 0 || hasParkingErrors) {
        notifications.show({
          title: 'Form Validation Error',
          message: hasParkingErrors
            ? 'Select at least one Accessible Parking detail (ADA) before publishing.'
            : `Please fix the errors in the form before ${publicationStatus === 'draft' ? 'saving draft' : 'publishing'}`,
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