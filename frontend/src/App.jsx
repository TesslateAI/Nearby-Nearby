import { AppShell, Burger, Group, Title, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route, Link } from 'react-router-dom';
import POIList from './components/POIList';
import POIForm from './components/POIForm';
import POIMap from './components/POIMap'; // Import the map component

function App() {
  const [opened, { toggle }] = useDisclosure();

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
        <NavLink label="Create New POI" component={Link} to="/poi/new" /> {/* This is now the third item */}
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<POIList />} />
          <Route path="/map" element={<POIMap />} />
          <Route path="/poi/new" element={<POIForm />} />
          <Route path="/poi/:id/edit" element={<POIForm />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;