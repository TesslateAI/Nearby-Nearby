# Relationship System

## Overview

The Relationship System enables linking POIs together with typed relationships. This allows modeling real-world connections like "Event at Venue", "Trail in Park", or "Business sponsors Event".

**Key Files:**
- `nearby-admin/backend/app/models/poi.py` - POIRelationship model
- `nearby-admin/backend/app/api/endpoints/relationships.py` - API endpoints
- `nearby-admin/frontend/src/components/RelationshipManager.jsx` - Management UI
- `nearby-admin/frontend/src/components/RelationshipSearch.jsx` - POI search

---

## Relationship Types

| Type | Source | Target | Description |
|------|--------|--------|-------------|
| `event_venue` | Event | Business, Park | Event takes place at location |
| `event_vendor` | Event | Business | Business is a vendor at event |
| `event_sponsor` | Event | Business | Business sponsors the event |
| `trail_in_park` | Trail | Park | Trail is located within park |
| `service_provider` | Trail, Park | Business | Business provides services |
| `related` | Any | Any | General relationship |

---

## Data Model

```python
# nearby-admin/backend/app/models/poi.py

class POIRelationship(Base):
    __tablename__ = "poi_relationships"

    source_poi_id = Column(
        UUID(as_uuid=True),
        ForeignKey("points_of_interest.id"),
        primary_key=True
    )
    target_poi_id = Column(
        UUID(as_uuid=True),
        ForeignKey("points_of_interest.id"),
        primary_key=True
    )
    relationship_type = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    source_poi = relationship(
        "PointOfInterest",
        foreign_keys=[source_poi_id],
        backref="outgoing_relationships"
    )
    target_poi = relationship(
        "PointOfInterest",
        foreign_keys=[target_poi_id],
        backref="incoming_relationships"
    )
```

---

## Validation Rules

Each relationship type has specific validation rules:

```python
# nearby-admin/backend/app/api/endpoints/relationships.py

RELATIONSHIP_RULES = {
    "event_venue": {
        "source_types": ["EVENT"],
        "target_types": ["BUSINESS", "PARK"],
        "description": "Event takes place at this venue"
    },
    "event_vendor": {
        "source_types": ["EVENT"],
        "target_types": ["BUSINESS"],
        "description": "Business is a vendor at this event"
    },
    "event_sponsor": {
        "source_types": ["EVENT"],
        "target_types": ["BUSINESS"],
        "description": "Business sponsors this event"
    },
    "trail_in_park": {
        "source_types": ["TRAIL"],
        "target_types": ["PARK"],
        "description": "Trail is located in this park"
    },
    "service_provider": {
        "source_types": ["TRAIL", "PARK"],
        "target_types": ["BUSINESS"],
        "description": "Business provides services for this location"
    },
    "related": {
        "source_types": None,  # Any type
        "target_types": None,  # Any type
        "description": "Generally related POIs"
    }
}

def validate_relationship(
    source_poi: PointOfInterest,
    target_poi: PointOfInterest,
    relationship_type: str
) -> tuple[bool, str]:
    """Validate a relationship is allowed."""

    if relationship_type not in RELATIONSHIP_RULES:
        return False, f"Unknown relationship type: {relationship_type}"

    rules = RELATIONSHIP_RULES[relationship_type]

    # Check source type
    if rules["source_types"] and source_poi.poi_type not in rules["source_types"]:
        return False, f"Source POI must be one of: {rules['source_types']}"

    # Check target type
    if rules["target_types"] and target_poi.poi_type not in rules["target_types"]:
        return False, f"Target POI must be one of: {rules['target_types']}"

    # Check not self-referential
    if source_poi.id == target_poi.id:
        return False, "POI cannot be related to itself"

    return True, ""
```

---

## CRUD Operations

### Create Relationship

```python
def create_relationship(
    db: Session,
    source_poi_id: UUID,
    target_poi_id: UUID,
    relationship_type: str
) -> POIRelationship:
    """Create a new POI relationship with validation."""

    # Get POIs
    source = db.query(PointOfInterest).filter(
        PointOfInterest.id == source_poi_id
    ).first()
    target = db.query(PointOfInterest).filter(
        PointOfInterest.id == target_poi_id
    ).first()

    if not source or not target:
        raise ValueError("Source or target POI not found")

    # Validate
    valid, error = validate_relationship(source, target, relationship_type)
    if not valid:
        raise ValueError(error)

    # Check for duplicate
    existing = db.query(POIRelationship).filter(
        POIRelationship.source_poi_id == source_poi_id,
        POIRelationship.target_poi_id == target_poi_id,
        POIRelationship.relationship_type == relationship_type
    ).first()

    if existing:
        raise ValueError("Relationship already exists")

    # Create
    relationship = POIRelationship(
        source_poi_id=source_poi_id,
        target_poi_id=target_poi_id,
        relationship_type=relationship_type
    )
    db.add(relationship)
    db.commit()
    db.refresh(relationship)
    return relationship
```

### Get Relationships for POI

```python
def get_relationships_for_poi(
    db: Session,
    poi_id: UUID,
    direction: str = "both"
) -> dict:
    """Get all relationships for a POI."""

    result = {"outgoing": [], "incoming": []}

    if direction in ["both", "outgoing"]:
        outgoing = db.query(POIRelationship).options(
            joinedload(POIRelationship.target_poi)
        ).filter(
            POIRelationship.source_poi_id == poi_id
        ).all()
        result["outgoing"] = outgoing

    if direction in ["both", "incoming"]:
        incoming = db.query(POIRelationship).options(
            joinedload(POIRelationship.source_poi)
        ).filter(
            POIRelationship.target_poi_id == poi_id
        ).all()
        result["incoming"] = incoming

    return result
```

### Delete Relationship

```python
def delete_relationship(
    db: Session,
    source_poi_id: UUID,
    target_poi_id: UUID,
    relationship_type: str
) -> bool:
    """Delete a specific relationship."""
    relationship = db.query(POIRelationship).filter(
        POIRelationship.source_poi_id == source_poi_id,
        POIRelationship.target_poi_id == target_poi_id,
        POIRelationship.relationship_type == relationship_type
    ).first()

    if not relationship:
        return False

    db.delete(relationship)
    db.commit()
    return True
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/relationships/` | Create relationship | Yes |
| GET | `/api/relationships/` | List all relationships | Public |
| GET | `/api/relationships/{poi_id}` | Get POI relationships | Public |
| DELETE | `/api/relationships/{source}/{target}/{type}` | Delete relationship | Yes |

### Create Relationship

```python
@router.post("/")
async def create_relationship(
    data: RelationshipCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new POI relationship."""
    try:
        relationship = crud_relationship.create_relationship(
            db,
            data.source_poi_id,
            data.target_poi_id,
            data.relationship_type
        )
        return relationship
    except ValueError as e:
        raise HTTPException(400, str(e))
```

### Get POI Relationships

```python
@router.get("/{poi_id}")
async def get_poi_relationships(
    poi_id: UUID,
    direction: str = Query("both", enum=["both", "outgoing", "incoming"]),
    db: Session = Depends(get_db)
):
    """Get all relationships for a POI."""
    return crud_relationship.get_relationships_for_poi(db, poi_id, direction)
```

---

## Frontend Components

### Relationship Manager

```jsx
// nearby-admin/frontend/src/components/RelationshipManager.jsx

function RelationshipManager({ poiId, poiType }) {
  const [relationships, setRelationships] = useState({ outgoing: [], incoming: [] });
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/relationships/${poiId}`)
      .then(res => res.json())
      .then(setRelationships);
  }, [poiId]);

  // Get available relationship types based on POI type
  const availableTypes = useMemo(() => {
    return Object.entries(RELATIONSHIP_RULES)
      .filter(([_, rules]) =>
        !rules.source_types || rules.source_types.includes(poiType)
      )
      .map(([type, rules]) => ({
        value: type,
        label: rules.description
      }));
  }, [poiType]);

  const handleDelete = async (sourceId, targetId, type) => {
    await fetch(`/api/relationships/${sourceId}/${targetId}/${type}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    // Refresh relationships
    fetchRelationships();
  };

  return (
    <div>
      <Group justify="space-between">
        <Title order={4}>Relationships</Title>
        <Button onClick={() => setAddModalOpen(true)}>Add Relationship</Button>
      </Group>

      {/* Outgoing relationships */}
      <Text weight={500} mt="md">This POI relates to:</Text>
      {relationships.outgoing.map(rel => (
        <RelationshipCard
          key={`${rel.source_poi_id}-${rel.target_poi_id}-${rel.relationship_type}`}
          relationship={rel}
          poi={rel.target_poi}
          type={rel.relationship_type}
          onDelete={() => handleDelete(rel.source_poi_id, rel.target_poi_id, rel.relationship_type)}
        />
      ))}

      {/* Incoming relationships */}
      <Text weight={500} mt="md">Related from:</Text>
      {relationships.incoming.map(rel => (
        <RelationshipCard
          key={`${rel.source_poi_id}-${rel.target_poi_id}-${rel.relationship_type}`}
          relationship={rel}
          poi={rel.source_poi}
          type={rel.relationship_type}
          direction="incoming"
          onDelete={() => handleDelete(rel.source_poi_id, rel.target_poi_id, rel.relationship_type)}
        />
      ))}

      <AddRelationshipModal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        sourcePoiId={poiId}
        sourcePoiType={poiType}
        availableTypes={availableTypes}
        onAdd={fetchRelationships}
      />
    </div>
  );
}
```

### Relationship Card

```jsx
// nearby-admin/frontend/src/components/RelationshipCard.jsx

function RelationshipCard({ relationship, poi, type, direction, onDelete }) {
  const typeLabel = RELATIONSHIP_RULES[type]?.description || type;

  return (
    <Card p="sm" withBorder mb="xs">
      <Group justify="space-between">
        <div>
          <Badge variant="light" size="sm">{typeLabel}</Badge>
          <Text weight={500}>{poi.name}</Text>
          <Text size="sm" c="dimmed">
            {poi.poi_type} • {poi.address_city}
          </Text>
        </div>
        <ActionIcon color="red" onClick={onDelete}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );
}
```

### Relationship Search

```jsx
// nearby-admin/frontend/src/components/RelationshipSearch.jsx

function RelationshipSearch({ onSelect, filterType, excludeIds }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebouncedCallback(async (q) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ q });
    if (filterType) params.append('poi_type', filterType);

    const response = await fetch(`/api/admin/pois/search?${params}`);
    const data = await response.json();

    // Filter out excluded POIs
    const filtered = data.filter(poi => !excludeIds.includes(poi.id));
    setResults(filtered);
    setLoading(false);
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

  return (
    <div>
      <TextInput
        placeholder="Search for POI..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rightSection={loading && <Loader size="xs" />}
      />

      {results.length > 0 && (
        <Paper shadow="sm" p="xs" mt="xs">
          {results.map(poi => (
            <UnstyledButton
              key={poi.id}
              onClick={() => onSelect(poi)}
              style={{ display: 'block', width: '100%' }}
            >
              <Group>
                <Badge size="xs">{poi.poi_type}</Badge>
                <Text>{poi.name}</Text>
                <Text size="xs" c="dimmed">{poi.address_city}</Text>
              </Group>
            </UnstyledButton>
          ))}
        </Paper>
      )}
    </div>
  );
}
```

### Add Relationship Modal

```jsx
function AddRelationshipModal({ opened, onClose, sourcePoiId, sourcePoiType, availableTypes, onAdd }) {
  const [selectedType, setSelectedType] = useState('');
  const [targetPoi, setTargetPoi] = useState(null);

  // Get allowed target types based on selected relationship type
  const allowedTargetTypes = useMemo(() => {
    if (!selectedType) return null;
    return RELATIONSHIP_RULES[selectedType]?.target_types;
  }, [selectedType]);

  const handleSubmit = async () => {
    await fetch('/api/relationships/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        source_poi_id: sourcePoiId,
        target_poi_id: targetPoi.id,
        relationship_type: selectedType
      })
    });

    onAdd();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add Relationship">
      <Select
        label="Relationship Type"
        data={availableTypes}
        value={selectedType}
        onChange={setSelectedType}
      />

      {selectedType && (
        <div>
          <Text size="sm" mt="md" mb="xs">Search for target POI:</Text>
          <RelationshipSearch
            onSelect={setTargetPoi}
            filterType={allowedTargetTypes?.[0]}
            excludeIds={[sourcePoiId]}
          />
        </div>
      )}

      {targetPoi && (
        <Card mt="md">
          <Text weight={500}>{targetPoi.name}</Text>
          <Text size="sm">{targetPoi.poi_type}</Text>
        </Card>
      )}

      <Button
        fullWidth
        mt="md"
        onClick={handleSubmit}
        disabled={!selectedType || !targetPoi}
      >
        Create Relationship
      </Button>
    </Modal>
  );
}
```

---

## Use Cases

### Event with Venue

```
Event: "Pittsboro Food Festival"
  └── event_venue → Park: "Downtown Pittsboro Green"
  └── event_vendor → Business: "Joe's Coffee"
  └── event_vendor → Business: "BBQ Brothers"
  └── event_sponsor → Business: "First Bank"
```

### Trail in Park

```
Trail: "Lakeshore Loop"
  └── trail_in_park → Park: "Jordan Lake State Park"
  └── service_provider → Business: "Adventure Rentals"
```

---

## Best Practices

1. **Validate types** - Always validate source/target POI types match rules
2. **Prevent duplicates** - Check for existing relationships before creating
3. **No self-references** - POIs cannot relate to themselves
4. **Cascade deletes** - Remove relationships when POIs are deleted
5. **Show bidirectional** - Display both outgoing and incoming relationships
6. **Filter search results** - Only show valid target types in search
