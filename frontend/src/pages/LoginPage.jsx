import { useState } from 'react';
import { 
  Paper, 
  TextInput, 
  PasswordInput, 
  Button, 
  Title, 
  Text, 
  Container, 
  Group, 
  Stack,
  Alert,
  Loader,
  Divider
} from '@mantine/core';
import { IconAlertCircle, IconLock, IconUser, IconTestPipe } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create form data as expected by FastAPI OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Use the login function from AuthContext
        login(data.access_token, email);
        
        notifications.show({
          title: 'Welcome back!',
          message: 'Successfully logged in to Nearby Nearby Admin',
          color: 'green',
        });
        
        navigate('/');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid email or password');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Demo login for testing purposes
    login('demo-token', 'admin@nearbynearby.com');
    notifications.show({
      title: 'Demo Mode',
      message: 'Logged in with demo credentials',
      color: 'blue',
    });
    navigate('/');
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={1} mb="xl">
        Nearby Nearby Admin
      </Title>
      
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftSection={<IconUser size="1rem" />}
              disabled={loading}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftSection={<IconLock size="1rem" />}
              disabled={loading}
            />

            {error && (
              <Alert icon={<IconAlertCircle size="1rem" />} title="Login Error" color="red">
                {error}
              </Alert>
            )}

            <Button 
              type="submit" 
              fullWidth 
              mt="xl"
              loading={loading}
              leftSection={loading ? <Loader size="1rem" /> : null}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </form>

        <Divider my="md" label="or" labelPosition="center" />

        <Button 
          variant="outline" 
          fullWidth 
          onClick={handleDemoLogin}
          leftSection={<IconTestPipe size="1rem" />}
        >
          Demo Login
        </Button>

        <Text c="dimmed" size="sm" ta="center" mt={20}>
          For internal team use only
        </Text>
      </Paper>
    </Container>
  );
}

export default LoginPage; 