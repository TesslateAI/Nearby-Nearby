import { useState, useEffect } from 'react';
import { Table, Button, Group, Title, Anchor, Text, Paper, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash, IconPlus, IconTestPipe } from '@tabler/icons-react';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';

function POIList() {
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { getAuthToken } = useAuth();

  const isDemoMode = () => {
    return getAuthToken() === 'demo-token';
  };

  const fetchPois = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/pois/');
      if (response.ok) {
        const data = await response.json();
        setPois(data);
      } else {
        throw new Error('Failed to fetch POIs');
      }
    } catch (error) {
      notifications.show({
        title: 'Error fetching data',
        message: 'Could not load points of interest.',
        color: 'red',
        autoClose: 5000,
      });
      console.error("Error fetching POIs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPois();
  }, []);

  const handleDelete = async (poiId) => {
    if (window.confirm('Are you sure you want to delete this POI?')) {
      try {
        const response = await api.delete(`/api/pois/${poiId}`);
        if (response.ok) {
          notifications.show({
            title: 'Success!',
            message: isDemoMode() ? 'Demo: POI would be deleted' : 'POI deleted successfully!',
            color: 'green',
          });
          fetchPois();
        } else {
          throw new Error('Failed to delete POI');
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete POI.',
          color: 'red',
        });
        console.error("Error deleting POI:", error);
      }
    }
  };

  const rows = pois.map((poi) => (
    <Table.Tr key={poi.id} style={{ transition: 'background-color 0.2s' }}>
      <Table.Td>
        <Anchor component={Link} to={`/poi/${poi.id}/edit`} fw={500}>
            {poi.name}
        </Anchor>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" tt="capitalize">{poi.poi_type}</Text>
      </Table.Td>
      <Table.Td>{poi.address_city}</Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {poi.is_verified ? '✓ Verified' : 'Unverified'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Edit POI">
            <ActionIcon variant="subtle" color="gray" onClick={() => navigate(`/poi/${poi.id}/edit`)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete POI">
            <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(poi.id)}>
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper>
      <Group justify="space-between" mb="lg">
        <Group>
          <Title order={2} c="deep-purple.7">Points of Interest</Title>
          {isDemoMode() && (
            <Badge 
              leftSection={<IconTestPipe size="0.8rem" />} 
              color="blue" 
              variant="light"
            >
              Demo Mode
            </Badge>
          )}
        </Group>
        <Button onClick={() => navigate('/poi/new')} leftSection={<IconPlus size={18} />}>
            Create New POI
        </Button>
      </Group>
      
      {loading ? (
        <Text c="dimmed" ta="center" py="xl">
          Loading POIs...
        </Text>
      ) : pois.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>City</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
            No points of interest found. Create one to get started!
        </Text>
      )}
      
      {isDemoMode() && (
        <Text c="dimmed" size="sm" ta="center" mt="md">
          Demo mode: Using mock data. No actual API calls are made.
        </Text>
      )}
    </Paper>
  );
}

export default POIList;