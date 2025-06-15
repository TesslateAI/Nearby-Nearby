import { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Group, Title, Anchor, Text, Paper, ActionIcon, Tooltip } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

function POIList() {
  const [pois, setPois] = useState([]);
  const navigate = useNavigate();

  const fetchPois = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/pois/`);
      setPois(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error fetching data',
        message: 'Could not load points of interest.',
        color: 'red',
        autoClose: 5000,
      });
      console.error("Error fetching POIs:", error);
    }
  };

  useEffect(() => {
    fetchPois();
  }, []);

  const handleDelete = async (poiId) => {
    if (window.confirm('Are you sure you want to delete this POI?')) {
      try {
        await axios.delete(`${API_URL}/api/pois/${poiId}`);
        notifications.show({
          title: 'Success!',
          message: 'POI deleted successfully!',
          color: 'green',
        });
        fetchPois();
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
      <Table.Td>{poi.location?.city}</Table.Td>
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
        <Title order={2} c="deep-purple.7">Points of Interest</Title>
        <Button onClick={() => navigate('/poi/new')} leftSection={<IconPlus size={18} />}>
            Create New POI
        </Button>
      </Group>
      {pois.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>City</Table.Th>
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
    </Paper>
  );
}

export default POIList;