import { AppShell, Group, Title, NavLink, Button, Text, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { IconLogout, IconX, IconMenu2 } from '@tabler/icons-react';
import POIList from './components/POIList';
import POIForm from './components/POIForm/POIForm';
import POIMap from './components/POIMap';
import CategoryList from './components/CategoryList';
import CategoryForm from './components/CategoryForm';
import AttributeManager from './components/AttributeManager';
import PrimaryTypeList from './components/PrimaryTypeList';
import PoiDetailPage from './pages/PoiDetailPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './utils/AuthContext';

function App() {
  const [opened, { toggle }] = useDisclosure(true);
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
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened, desktop: !opened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              {!opened && (
                <ActionIcon variant="subtle" onClick={toggle} size="lg">
                  <IconMenu2 size={20} />
                </ActionIcon>
              )}
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
          <Group justify="space-between" mb="md">
            <Text fw={600} size="sm" c="dimmed">Menu</Text>
            <ActionIcon variant="subtle" onClick={toggle} size="sm">
              <IconX size={16} />
            </ActionIcon>
          </Group>
          <NavLink label="Points of Interest" component={Link} to="/" />
          <NavLink label="POI Map" component={Link} to="/map" />
          <NavLink label="Manage Categories" component={Link} to="/categories" />
          <NavLink label="Manage Primary Types" component={Link} to="/primary-types" />
          <NavLink label="Manage Attributes" component={Link} to="/attributes" />
          <NavLink label="Create New POI" component={Link} to="/poi/new" />
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<POIList />} />
            <Route path="/map" element={<POIMap />} />
            <Route path="/poi/new" element={<POIForm />} />
            <Route path="/poi/:id/edit" element={<POIForm />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/primary-types" element={<PrimaryTypeList />} />
            <Route path="/category/new" element={<CategoryForm />} />
            <Route path="/category/:id/edit" element={<CategoryForm />} />
            <Route path="/attributes" element={<AttributeManager />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </ProtectedRoute>
  );
}

export default App;