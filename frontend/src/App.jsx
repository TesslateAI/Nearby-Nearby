import { AppShell, Burger, Group, Title, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { IconRocket } from '@tabler/icons-react';
import POIList from './components/POIList';
import POIForm from './components/POIForm';
import POIMap from './components/POIMap';
import CategoryList from './components/CategoryList'; 
import CategoryForm from './components/CategoryForm';
import PublicHomePage from './pages/PublicHomePage';
import PoiDetailPage from './pages/PoiDetailPage'; // New Detail Page

function App() {
  const [opened, { toggle }] = useDisclosure();
  const location = useLocation();

  // Hide AppShell for public detail page
  if (location.pathname.startsWith('/poi/detail')) {
    return (
       <Routes>
         <Route path="/poi/detail/:id" element={<PoiDetailPage />} />
       </Routes>
    )
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Title order={3} component={Link} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Nearby Nearby Admin
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink label="Points of Interest" component={Link} to="/" />
        <NavLink label="POI Map" component={Link} to="/map" />
        <NavLink label="Manage Categories" component={Link} to="/categories" />
        <NavLink label="Create New POI" component={Link} to="/poi/new" />
        <NavLink 
          label="Launch Nearby Nearby" 
          component={Link} 
          to="/launch" 
          target="_blank" // Open in new tab
          leftSection={<IconRocket size="1rem" />}
          color="teal"
          variant="filled"
          active
          mt="xl"
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<POIList />} />
          <Route path="/map" element={<POIMap />} />
          <Route path="/poi/new" element={<POIForm />} />
          <Route path="/poi/:id/edit" element={<POIForm />} />
          <Route path="/categories" element={<CategoryList />} />
          <Route path="/category/new" element={<CategoryForm />} />
          <Route path="/category/:id/edit" element={<CategoryForm />} />
          <Route path="/launch" element={<PublicHomePage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;