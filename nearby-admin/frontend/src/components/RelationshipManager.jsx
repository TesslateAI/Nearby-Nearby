import { useState, useEffect } from 'react';
import {
  Paper, Title, Text, Button, Group, Stack, Modal, Divider, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import api from '../utils/api';
import RelationshipCard from './RelationshipCard';
import RelationshipSearch from './RelationshipSearch';
import { 
  getRelationshipLabel, 
  getRelationshipColor 
} from './relationships';

function RelationshipManager({ 
  poiId, 
  poiType, 
  poiName, 
  // New props for external modal control
  modalOpened = false,
  onModalClose = null,
  showManageButton = true,
  readOnly = false
}) {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Use external modal control if provided, otherwise use internal state
  const isModalOpen = onModalClose ? modalOpened : modalOpen;
  const handleModalClose = onModalClose || (() => setModalOpen(false));

  // Fetch existing relationships
  const fetchRelationships = async () => {
    if (!poiId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/relationships/${poiId}`);
      if (response.ok) {
        const data = await response.json();
        setRelationships(data);
      } else {
        throw new Error('Failed to fetch relationships');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load relationships',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete a relationship
  const deleteRelationship = async (sourceId, targetId, relationshipType) => {
    if (!window.confirm('Are you sure you want to delete this relationship?')) {
      return;
    }

    try {
      const response = await api.delete(`/relationships/${sourceId}/${targetId}/${relationshipType}`);
      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Relationship deleted successfully',
          color: 'green',
        });
        fetchRelationships();
      } else {
        throw new Error('Failed to delete relationship');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete relationship',
        color: 'red',
      });
    }
  };

  // Get related POI details
  const getRelatedPoiDetails = async (poiId) => {
    try {
      const response = await api.get(`/pois/${poiId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch POI details:', error);
    }
    return null;
  };

  // Handle modal close
  const handleInternalModalClose = () => {
    setModalOpen(false);
  };

  // Use the appropriate close handler
  const handleClose = onModalClose ? 
    () => {
      onModalClose();
    } : 
    handleInternalModalClose;

  useEffect(() => {
    fetchRelationships();
  }, [poiId]);



  return (
    <div>
      {showManageButton && !readOnly && (
        <Group justify="space-between" mb="lg">
          <Stack gap="xs">
            <Title order={3}>Relationships</Title>
            <Text size="sm" c="dimmed">
              Connect this POI to other points of interest to help users discover related places and services.
            </Text>
          </Stack>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => setModalOpen(true)}
          >
            Manage Relationships
          </Button>
        </Group>
      )}

      {showManageButton && readOnly && (
        <Group justify="space-between" mb="lg">
          <Stack gap="xs">
            <Title order={3}>Relationships</Title>
            <Text size="sm" c="dimmed">
              Related points of interest connected to this POI.
            </Text>
          </Stack>
        </Group>
      )}

      {loading ? (
        <Text c="dimmed" ta="center" py="xl">Loading relationships...</Text>
      ) : relationships.length > 0 ? (
        <Stack gap="sm">
          {relationships.map((relationship, index) => (
            <RelationshipCard
              key={`${relationship.source_poi_id}-${relationship.target_poi_id}-${relationship.relationship_type}`}
              relationship={relationship}
              currentPoiId={poiId}
              onDelete={deleteRelationship}
              getRelatedPoiDetails={getRelatedPoiDetails}
              readOnly={readOnly}
            />
          ))}
        </Stack>
      ) : (
        <Alert color="blue" variant="light">
          <Text size="sm">No relationships defined for this POI.</Text>
          <Text size="sm" c="dimmed">Click "Manage Relationships" to link this POI to others.</Text>
        </Alert>
      )}

      {/* Unified Modal */}
      <Modal 
        opened={isModalOpen} 
        onClose={handleClose}
        title={`${readOnly ? 'View' : 'Manage'} Relationships - ${poiName}`}
        size="xl"
      >
        <Stack gap="lg">
          {/* View Relationships Section */}
          <div>
            <Group justify="space-between" mb="md">
              <Title order={4}>Current Relationships ({relationships.length})</Title>
            </Group>
            
            {relationships.length > 0 ? (
              <Stack gap="sm">
                {relationships.map((relationship, index) => (
                  <RelationshipCard
                    key={`${relationship.source_poi_id}-${relationship.target_poi_id}-${relationship.relationship_type}`}
                    relationship={relationship}
                    currentPoiId={poiId}
                    onDelete={deleteRelationship}
                    getRelatedPoiDetails={getRelatedPoiDetails}
                    readOnly={readOnly}
                  />
                ))}
              </Stack>
            ) : (
              <Alert color="blue" variant="light">
                <Text size="sm">No relationships defined for this POI.</Text>
                {!readOnly && (
                  <Text size="sm" c="dimmed">Use the form below to add relationships.</Text>
                )}
              </Alert>
            )}
          </div>

          {!readOnly && (
            <>
              <Divider />

              {/* Add Relationships Section */}
              <div>
                <Title order={4} mb="md">Add New Relationship</Title>
                <RelationshipSearch
                  poiId={poiId}
                  poiType={poiType}
                  poiName={poiName}
                  onRelationshipAdded={fetchRelationships}
                  existingRelationships={relationships}
                />
              </div>
            </>
          )}
        </Stack>
      </Modal>
    </div>
  );
}

export default RelationshipManager; 