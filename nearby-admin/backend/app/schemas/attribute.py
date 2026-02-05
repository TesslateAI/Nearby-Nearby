import uuid
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class AttributeBase(BaseModel):
    name: str
    type: str
    parent_id: Optional[uuid.UUID] = None
    applicable_to: Optional[List[str]] = None
    is_active: bool = True
    sort_order: int = 0


class AttributeCreate(AttributeBase):
    pass


class AttributeUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    applicable_to: Optional[List[str]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class Attribute(AttributeBase):
    id: uuid.UUID
    children: List['Attribute'] = []
    model_config = ConfigDict(from_attributes=True)


# Update forward reference
Attribute.model_rebuild() 