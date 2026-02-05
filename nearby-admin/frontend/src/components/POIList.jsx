import { useState, useEffect } from 'react';
import { Table, Button, Group, Title, Anchor, Text, Paper, ActionIcon, Tooltip, Badge, UnstyledButton, Center, TextInput, Select, Stack } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPencil, IconTrash, IconPlus, IconLink, IconChevronUp, IconChevronDown, IconSelector, IconSearch, IconX } from '@tabler/icons-react';
import api from '../utils/api';
import { useAuth } from '../utils/AuthContext';
import RelationshipManager from './RelationshipManager';

function POIList() {
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relationshipsModalOpen, setRelationshipsModalOpen] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchPois = async () => {
    setLoading(true);
    try {
      // Try admin endpoint first to see all POIs including drafts
      const response = await api.get('/admin/pois/');
      if (response.ok) {
        const data = await response.json();
        setPois(data);
      } else if (response.status === 403) {
        // If forbidden (not authenticated), fallback to public endpoint
        console.warn('Admin access denied, falling back to public POI list');
        const publicResponse = await api.get('/pois/?limit=1000');
        if (publicResponse.ok) {
          const data = await publicResponse.json();
          setPois(data);
        } else {
          throw new Error('Failed to fetch POIs from public endpoint');
        }
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
    modals.openConfirmModal({
      title: 'Delete POI',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this POI? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete POI', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          const response = await api['delete'](`/pois/${poiId}`);
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
    });
  };

  const handleRelationshipsModalClose = () => {
    setRelationshipsModalOpen(false);
    setSelectedPoi(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <IconSelector size={14} />;
    }
    return sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />;
  };

  const getUniqueTypes = () => {
    const types = [...new Set(pois.map(poi => poi.poi_type).filter(Boolean))];
    return types.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }));
  };

  const getUniqueCities = () => {
    const cities = [...new Set(pois.map(poi => poi.address_city).filter(Boolean))];
    return cities.map(city => ({ value: city, label: city }));
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(pois.map(poi => poi.publication_status || 'draft'))];
    return statuses.map(status => ({ value: status, label: status.charAt(0).toUpperCase() + status.slice(1) }));
  };

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter('');
    setCityFilter('');
    setStatusFilter('');
  };

  const filteredAndSortedPois = [...pois]
    .filter((poi) => {
      // Text search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesName = poi.name?.toLowerCase().includes(searchLower);
        const matchesType = poi.poi_type?.toLowerCase().includes(searchLower);
        const matchesCity = poi.address_city?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesType && !matchesCity) {
          return false;
        }
      }

      // Type filter
      if (typeFilter && poi.poi_type !== typeFilter) {
        return false;
      }

      // City filter
      if (cityFilter && poi.address_city !== cityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && (poi.publication_status || 'draft') !== statusFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (sortBy === 'name') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      } else if (sortBy === 'poi_type') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      } else if (sortBy === 'address_city') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      } else if (sortBy === 'publication_status') {
        aValue = aValue || 'draft';
        bValue = bValue || 'draft';
        // Custom order: published > draft > other
        const statusOrder = { published: 0, draft: 1 };
        aValue = statusOrder[aValue] !== undefined ? statusOrder[aValue] : 2;
        bValue = statusOrder[bValue] !== undefined ? statusOrder[bValue] : 2;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const rows = filteredAndSortedPois.map((poi) => (
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
          <Badge
            color={poi.publication_status === 'published' ? 'green' :
                   poi.publication_status === 'draft' ? 'gray' : 'orange'}
            variant="filled"
            size="sm"
          >
            {poi.publication_status || 'draft'}
          </Badge>
          {poi.is_verified && (
            <Badge color="blue" variant="light" size="sm">
              ✓ Verified
            </Badge>
          )}
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

      {/* Filters */}
      <Stack gap="md" mb="lg">
        <Group align="flex-end">
          <TextInput
            placeholder="Search by name, type, or city..."
            value={searchText}
            onChange={(event) => setSearchText(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1, minWidth: 300 }}
          />
          <Select
            placeholder="Filter by Type"
            value={typeFilter}
            onChange={setTypeFilter}
            data={getUniqueTypes()}
            clearable
            style={{ minWidth: 150 }}
          />
          <Select
            placeholder="Filter by City"
            value={cityFilter}
            onChange={setCityFilter}
            data={getUniqueCities()}
            clearable
            style={{ minWidth: 150 }}
          />
          <Select
            placeholder="Filter by Status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={getUniqueStatuses()}
            clearable
            style={{ minWidth: 150 }}
          />
          {(searchText || typeFilter || cityFilter || statusFilter) && (
            <Button variant="light" color="gray" onClick={clearFilters} leftSection={<IconX size={16} />}>
              Clear Filters
            </Button>
          )}
        </Group>
        {(searchText || typeFilter || cityFilter || statusFilter) && (
          <Text size="sm" c="dimmed">
            Showing {filteredAndSortedPois.length} of {pois.length} POIs
          </Text>
        )}
      </Stack>
      
      {loading ? (
        <Text c="dimmed" ta="center" py="xl">
          Loading POIs...
        </Text>
      ) : filteredAndSortedPois.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead style={{ backgroundColor: 'var(--mantine-color-deep-purple-0)' }}>
            <Table.Tr>
              <Table.Th>
                <UnstyledButton onClick={() => handleSort('name')} style={{ width: '100%' }}>
                  <Group justify="space-between">
                    <Text fw={500}>Name</Text>
                    <Center>{getSortIcon('name')}</Center>
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th>
                <UnstyledButton onClick={() => handleSort('poi_type')} style={{ width: '100%' }}>
                  <Group justify="space-between">
                    <Text fw={500}>Type</Text>
                    <Center>{getSortIcon('poi_type')}</Center>
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th>
                <UnstyledButton onClick={() => handleSort('address_city')} style={{ width: '100%' }}>
                  <Group justify="space-between">
                    <Text fw={500}>City</Text>
                    <Center>{getSortIcon('address_city')}</Center>
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th>
                <UnstyledButton onClick={() => handleSort('publication_status')} style={{ width: '100%' }}>
                  <Group justify="space-between">
                    <Text fw={500}>Status</Text>
                    <Center>{getSortIcon('publication_status')}</Center>
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          {pois.length === 0
            ? "No points of interest found. Create one to get started!"
            : "No POIs match your current filters. Try adjusting your search criteria."
          }
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