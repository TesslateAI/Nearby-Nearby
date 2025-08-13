import { Component } from 'react';
import { Alert, Button, Container, Stack, Title, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" py="xl">
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Something went wrong"
            color="red"
            variant="filled"
          >
            <Stack spacing="md">
              <Text>
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </Text>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                  {this.state.error.toString()}
                </Text>
              )}
              <Button onClick={this.handleReset} variant="white" color="red">
                Return to Home
              </Button>
            </Stack>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;