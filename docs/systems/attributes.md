# Attribute System

## Overview

The Attribute System provides dynamic, admin-configurable fields for POIs. Instead of hardcoding every possible field, attributes allow flexible field definitions that can be added, modified, or removed without code changes.

**Key Files:**
- `nearby-admin/backend/app/models/attribute.py` - Attribute model
- `nearby-admin/backend/app/crud/crud_attribute.py` - CRUD operations
- `nearby-admin/backend/app/api/endpoints/attributes.py` - API endpoints
- `nearby-admin/frontend/src/components/AttributeManager.jsx` - Management UI
- `nearby-admin/frontend/src/components/DynamicAttributeForm.jsx` - Dynamic form

---

## Data Model

```python
# nearby-admin/backend/app/models/attribute.py

from sqlalchemy import Column, String, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class Attribute(Base):
    __tablename__ = "attributes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)  # Display name
    key = Column(String(100), nullable=False)   # Programmatic key
    attribute_type = Column(String(50), nullable=False)  # text, select, etc.
    applicable_poi_types = Column(ARRAY(String))  # POI types this applies to
    options = Column(JSONB)  # Options for select/multi-select types
    default_value = Column(String)  # Default value
    required = Column(Boolean, default=False)
    description = Column(Text)  # Help text
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

## Attribute Types

| Type | Description | Options Field |
|------|-------------|---------------|
| `text` | Single line text | Max length |
| `textarea` | Multi-line text | Max length, rows |
| `number` | Numeric input | Min, max, step |
| `select` | Single selection | List of options |
| `multi-select` | Multiple selection | List of options |
| `checkbox` | Boolean toggle | - |
| `date` | Date picker | Min/max date |
| `time` | Time picker | Min/max time |
| `url` | URL input | - |
| `email` | Email input | - |

---

## Attribute Storage

POI attribute values are stored in a JSONB column on the POI:

```python
# In PointOfInterest model
class PointOfInterest(Base):
    # ... other fields ...
    custom_attributes = Column(JSONB, default={})
```

Example stored data:
```json
{
  "wifi_available": true,
  "parking_type": "street",
  "payment_methods": ["cash", "credit", "mobile"],
  "max_capacity": 50
}
```

---

## CRUD Operations

### Create Attribute

```python
# nearby-admin/backend/app/crud/crud_attribute.py

def create_attribute(db: Session, attribute: AttributeCreate) -> Attribute:
    """Create a new attribute definition."""
    # Generate key from name if not provided
    key = attribute.key or slugify(attribute.name).replace('-', '_')

    # Validate options for select types
    if attribute.attribute_type in ['select', 'multi-select']:
        if not attribute.options or not attribute.options.get('choices'):
            raise ValueError("Select types require options.choices")

    db_attribute = Attribute(
        name=attribute.name,
        key=key,
        attribute_type=attribute.attribute_type,
        applicable_poi_types=attribute.applicable_poi_types,
        options=attribute.options,
        default_value=attribute.default_value,
        required=attribute.required,
        description=attribute.description
    )
    db.add(db_attribute)
    db.commit()
    db.refresh(db_attribute)
    return db_attribute
```

### Get Attributes for POI Type

```python
def get_attributes_for_poi_type(db: Session, poi_type: str) -> list[Attribute]:
    """Get all attributes applicable to a POI type."""
    return db.query(Attribute).filter(
        Attribute.applicable_poi_types.contains([poi_type])
    ).order_by(Attribute.display_order).all()
```

### Get Attribute Hierarchy

```python
def get_attribute_hierarchy(db: Session) -> dict:
    """Get attributes organized by POI type."""
    all_attributes = db.query(Attribute).all()

    hierarchy = {}
    for attr in all_attributes:
        for poi_type in (attr.applicable_poi_types or []):
            if poi_type not in hierarchy:
                hierarchy[poi_type] = []
            hierarchy[poi_type].append(attr)

    return hierarchy
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/attributes/` | Create attribute | Admin |
| GET | `/api/attributes/` | List all attributes | Public |
| GET | `/api/attributes/by-type/{type}` | Get by attribute type | Public |
| GET | `/api/attributes/for-poi-type/{type}` | Get for POI type | Public |
| GET | `/api/attributes/hierarchy` | Get organized by POI type | Public |
| PUT | `/api/attributes/{id}` | Update attribute | Admin |
| DELETE | `/api/attributes/{id}` | Delete attribute | Admin |

### Create Attribute Example

```json
// POST /api/attributes/
{
  "name": "WiFi Available",
  "key": "wifi_available",
  "attribute_type": "checkbox",
  "applicable_poi_types": ["BUSINESS"],
  "default_value": "false",
  "description": "Does this location offer free WiFi?"
}
```

### Select Attribute Example

```json
{
  "name": "Parking Type",
  "key": "parking_type",
  "attribute_type": "select",
  "applicable_poi_types": ["BUSINESS", "PARK"],
  "options": {
    "choices": [
      {"value": "street", "label": "Street Parking"},
      {"value": "lot", "label": "Parking Lot"},
      {"value": "garage", "label": "Parking Garage"},
      {"value": "none", "label": "No Parking"}
    ]
  },
  "required": true
}
```

### Multi-Select Example

```json
{
  "name": "Payment Methods",
  "key": "payment_methods",
  "attribute_type": "multi-select",
  "applicable_poi_types": ["BUSINESS"],
  "options": {
    "choices": [
      {"value": "cash", "label": "Cash"},
      {"value": "credit", "label": "Credit Card"},
      {"value": "debit", "label": "Debit Card"},
      {"value": "mobile", "label": "Mobile Payment"},
      {"value": "crypto", "label": "Cryptocurrency"}
    ]
  }
}
```

---

## Frontend Components

### Attribute Manager

```jsx
// nearby-admin/frontend/src/components/AttributeManager.jsx

function AttributeManager() {
  const [attributes, setAttributes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/attributes/')
      .then(res => res.json())
      .then(setAttributes);
  }, []);

  return (
    <div>
      <Group justify="space-between">
        <Title>Custom Attributes</Title>
        <Button onClick={() => setModalOpen(true)}>Add Attribute</Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Key</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Applicable To</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {attributes.map(attr => (
            <Table.Tr key={attr.id}>
              <Table.Td>{attr.name}</Table.Td>
              <Table.Td><Code>{attr.key}</Code></Table.Td>
              <Table.Td><Badge>{attr.attribute_type}</Badge></Table.Td>
              <Table.Td>
                {attr.applicable_poi_types?.map(t => (
                  <Badge key={t} variant="light">{t}</Badge>
                ))}
              </Table.Td>
              <Table.Td>
                <ActionIcon onClick={() => editAttribute(attr)}>
                  <IconEdit />
                </ActionIcon>
                <ActionIcon color="red" onClick={() => deleteAttribute(attr.id)}>
                  <IconTrash />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <AttributeModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
```

### Dynamic Attribute Form

```jsx
// nearby-admin/frontend/src/components/DynamicAttributeForm.jsx

function DynamicAttributeForm({ poiType, values, onChange }) {
  const [attributes, setAttributes] = useState([]);

  useEffect(() => {
    if (poiType) {
      fetch(`/api/attributes/for-poi-type/${poiType}`)
        .then(res => res.json())
        .then(setAttributes);
    }
  }, [poiType]);

  const renderField = (attribute) => {
    const value = values[attribute.key];
    const handleChange = (newValue) => {
      onChange({ ...values, [attribute.key]: newValue });
    };

    switch (attribute.attribute_type) {
      case 'text':
        return (
          <TextInput
            key={attribute.id}
            label={attribute.name}
            description={attribute.description}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={attribute.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            key={attribute.id}
            label={attribute.name}
            description={attribute.description}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            rows={attribute.options?.rows || 3}
          />
        );

      case 'number':
        return (
          <NumberInput
            key={attribute.id}
            label={attribute.name}
            description={attribute.description}
            value={value}
            onChange={handleChange}
            min={attribute.options?.min}
            max={attribute.options?.max}
            step={attribute.options?.step}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            key={attribute.id}
            label={attribute.name}
            description={attribute.description}
            checked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
          />
        );

      case 'select':
        return (
          <Select
            key={attribute.id}
            label={attribute.name}
            description={attribute.description}
            value={value}
            onChange={handleChange}
            data={attribute.options?.choices || []}
            required={attribute.required}
          />
        );

      case 'multi-select':
        return (
          <MultiSelect
            key={attribute.id}
            label={attribute.name}
            description={attribute.description}
            value={value || []}
            onChange={handleChange}
            data={attribute.options?.choices || []}
          />
        );

      case 'date':
        return (
          <DateInput
            key={attribute.id}
            label={attribute.name}
            value={value ? new Date(value) : null}
            onChange={(date) => handleChange(date?.toISOString())}
          />
        );

      default:
        return (
          <TextInput
            key={attribute.id}
            label={attribute.name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  return (
    <Stack>
      <Title order={4}>Additional Information</Title>
      {attributes.map(renderField)}
    </Stack>
  );
}
```

### Integration with POI Form

```jsx
// In POIForm.jsx
function POIForm({ poiId }) {
  const { form } = usePOIForm(poiId);

  return (
    <form>
      {/* ... standard fields ... */}

      {/* Dynamic attributes section */}
      <Accordion.Item value="custom-attributes">
        <Accordion.Control>Custom Attributes</Accordion.Control>
        <Accordion.Panel>
          <DynamicAttributeForm
            poiType={form.values.poi_type}
            values={form.values.custom_attributes || {}}
            onChange={(attrs) => form.setFieldValue('custom_attributes', attrs)}
          />
        </Accordion.Panel>
      </Accordion.Item>
    </form>
  );
}
```

---

## Validation

### Server-Side Validation

```python
def validate_attribute_values(
    attributes: list[Attribute],
    values: dict
) -> tuple[bool, list[str]]:
    """Validate attribute values against definitions."""
    errors = []

    for attr in attributes:
        value = values.get(attr.key)

        # Required check
        if attr.required and (value is None or value == ''):
            errors.append(f"{attr.name} is required")
            continue

        if value is None:
            continue

        # Type-specific validation
        if attr.attribute_type == 'number':
            if not isinstance(value, (int, float)):
                errors.append(f"{attr.name} must be a number")
            elif attr.options:
                if 'min' in attr.options and value < attr.options['min']:
                    errors.append(f"{attr.name} must be at least {attr.options['min']}")
                if 'max' in attr.options and value > attr.options['max']:
                    errors.append(f"{attr.name} must be at most {attr.options['max']}")

        elif attr.attribute_type == 'select':
            valid_values = [c['value'] for c in (attr.options.get('choices') or [])]
            if value not in valid_values:
                errors.append(f"{attr.name} has invalid value")

        elif attr.attribute_type == 'multi-select':
            valid_values = [c['value'] for c in (attr.options.get('choices') or [])]
            if not all(v in valid_values for v in value):
                errors.append(f"{attr.name} has invalid values")

    return len(errors) == 0, errors
```

---

## Best Practices

1. **Use meaningful keys** - Keys should be snake_case and descriptive
2. **Provide descriptions** - Help users understand what each attribute means
3. **Set defaults** - Provide sensible default values where appropriate
4. **Validate options** - Ensure select types have valid choices
5. **Order attributes** - Use display_order for logical grouping
6. **Document changes** - Track when attributes are modified
7. **Migrate data** - Handle existing data when changing attribute types
