import { Modal, Text, Group, Button } from '@mantine/core';

const ConfirmDialog = ({
  opened,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',
  loading = false,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      size="sm"
    >
      <Text mb="lg">{message}</Text>
      <Group position="right" spacing="sm">
        <Button variant="default" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          color={confirmColor}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </Group>
    </Modal>
  );
};

export default ConfirmDialog;