import { Center, Loader, Text, Stack } from '@mantine/core';

const LoadingSpinner = ({ message = 'Loading...', size = 'md', fullHeight = true }) => {
  return (
    <Center h={fullHeight ? '100vh' : '100%'}>
      <Stack align="center" spacing="md">
        <Loader size={size} />
        {message && <Text c="dimmed">{message}</Text>}
      </Stack>
    </Center>
  );
};

export default LoadingSpinner;