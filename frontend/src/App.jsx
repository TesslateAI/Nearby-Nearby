import { AppShell, Burger, Group, Title, NavLink, Button, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { IconRocket, IconSettings, IconLogout } from '@tabler/icons-react';
import POIList from './components/POIList';
import POIForm from './components/POIForm/POIForm';
import POIMap from './components/POIMap';
import CategoryList from './components/CategoryList'; 
import CategoryForm from './components/CategoryForm';
import AttributeManager from './components/AttributeManager';
import PublicHomePage from './pages/PublicHomePage';
import PoiDetailPage from './pages/PoiDetailPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './utils/AuthContext';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();
  const { logout, user } = useAuth();

  // Hide AppShell for public detail page
  if (location.pathname.startsWith('/poi/detail')) {
    return (
       <Routes>
         <Route path="/poi/detail/:id" element={<PoiDetailPage />} />
       </Routes>
    )
  }

  // Show login page if not authenticated
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Title order={3} component={Link} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                Nearby Nearby Admin
              </Title>
            </Group>
            <Group>
              {user && (
                <Text size="sm" c="dimmed">
                  {user.email}
                </Text>
              )}
              <Button 
                variant="subtle" 
                size="sm" 
                onClick={logout}
                leftSection={<IconLogout size="1rem" />}
              >
                Logout
              </Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <NavLink label="Points of Interest" component={Link} to="/" />
          <NavLink label="POI Map" component={Link} to="/map" />
          <NavLink label="Manage Categories" component={Link} to="/categories" />
          <NavLink label="Manage Attributes" component={Link} to="/attributes" />
          <NavLink label="Create New POI" component={Link} to="/poi/new" />
          <NavLink
            label="Launch Nearby Nearby"
            component={Link}
            to="/launch"
            leftSection={<IconRocket size="1rem" />}
            color="teal"
            variant="filled"
            active
            mt="xl"
          />
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<POIList />} />
            <Route path="/map" element={<POIMap />} />
            <Route path="/poi/new" element={<POIForm />} />
            <Route path="/poi/:id/edit" element={<POIForm />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/category/new" element={<CategoryForm />} />
            <Route path="/category/:id/edit" element={<CategoryForm />} />
            <Route path="/attributes" element={<AttributeManager />} />
            <Route path="/launch" element={<PublicHomePage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}

export default App;