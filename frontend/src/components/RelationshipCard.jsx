import { useState, useEffect } from 'react';
import { Paper, Text, Group, Stack, Badge, ActionIcon, Tooltip, Box } from '@mantine/core';
import { IconLink, IconTrash, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';
import { getRelationshipLabel, getRelationshipColor } from './relationships';

function RelationshipCard({ 
  relationship, 
  currentPoiId, 
  onDelete, 
  getRelatedPoiDetails, 
  readOnly = false
}) {
  const [relatedPoi, setRelatedPoi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedPoi = async () => {
      const targetId = relationship.source_poi_id === currentPoiId 
        ? relationship.target_poi_id 
        : relationship.source_poi_id;
      
      const poi = await getRelatedPoiDetails(targetId);
      setRelatedPoi(poi);
      setLoading(false);
    };

    fetchRelatedPoi();
  }, [relationship, currentPoiId, getRelatedPoiDetails]);

  if (loading) {
    return (
      <Paper p="sm" withBorder>
        <Text size="sm" c="dimmed">Loading...</Text>
      </Paper>
    );
  }

  if (!relatedPoi) {
    return (
      <Paper p="sm" withBorder>
        <Text size="sm" c="red">Related POI not found</Text>
      </Paper>
    );
  }

  const isSource = relationship.source_poi_id === currentPoiId;
  const DirectionIcon = isSource ? IconArrowRight : IconArrowLeft;
  const directionLabel = isSource ? 'outgoing' : 'incoming';

  return (
    <Paper p="sm" withBorder>
      <Group justify="space-between">
        <Group gap="sm">
          <IconLink size={16} />
          <Stack gap="xs">
            <Group gap="xs">
              <Text size="sm" fw={500}>{relatedPoi.name}</Text>
              <Badge size="xs" variant="light">{relatedPoi.poi_type}</Badge>
              <Badge 
                size="xs" 
                color={getRelationshipColor(relationship.relationship_type)}
              >
                {getRelationshipLabel(relationship.relationship_type)}
              </Badge>
            </Group>
            {relatedPoi.address_city && (
              <Text size="xs" c="dimmed">{relatedPoi.address_city}</Text>
            )}
          </Stack>
        </Group>
        
        <Group gap="xs">
          <Tooltip label={`${directionLabel} relationship`}>
            <Box
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: isSource 
                  ? theme.colors.blue[1] 
                  : theme.colors.green[1],
                color: isSource 
                  ? theme.colors.blue[7] 
                  : theme.colors.green[7],
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  backgroundColor: isSource 
                    ? theme.colors.blue[2] 
                    : theme.colors.green[2],
                }
              })}
            >
              <DirectionIcon size={14} />
            </Box>
          </Tooltip>
          {readOnly ? null : (
            <Tooltip label="Delete relationship">
              <ActionIcon
                size="sm"
                color="red"
                variant="subtle"
                onClick={() => onDelete(
                  relationship.source_poi_id,
                  relationship.target_poi_id,
                  relationship.relationship_type
                )}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>
    </Paper>
  );
}

export default RelationshipCard; 