import { useState, useEffect } from 'react';
import { Table, Button, Group, Title, Anchor, Text, Paper, ActionIcon, Tooltip } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash, IconPlus, IconLink } from '@tabler/icons-react';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import RelationshipManager from './RelationshipManager';

function POIList() {
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relationshipsModalOpen, setRelationshipsModalOpen] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const navigate = useNavigate();

  const fetchPois = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pois/');
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
        const response = await api.delete(`/pois/${poiId}`);
        if (response.ok) {
          notifications.show({
            title: 'Success!',
            message: 'POI deleted successfully!',
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

  const handleRelationshipsModalClose = () => {
    setRelationshipsModalOpen(false);
    setSelectedPoi(null);
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
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            {poi.is_verified ? '✓ Verified' : 'Unverified'}
          </Text>
          {/* Relationship count badge - this would need to be fetched separately */}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Manage Relationships">
            <ActionIcon variant="subtle" color="blue" onClick={() => {
              setSelectedPoi(poi);
              setRelationshipsModalOpen(true);
            }}>
              <IconLink size={18} />
            </ActionIcon>
          </Tooltip>
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

      {/* Use RelationshipManager's modal */}
      {selectedPoi && (
        <RelationshipManager
          poiId={selectedPoi.id}
          poiType={selectedPoi.poi_type}
          poiName={selectedPoi.name}
          modalOpened={relationshipsModalOpen}
          onModalClose={handleRelationshipsModalClose}
          showManageButton={false}
        />
      )}
    </Paper>
  );
}

export default POIList;