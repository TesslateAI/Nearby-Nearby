import uuid
from typing import List, Optional
from pydantic import BaseModel, model_validator, ConfigDict
import re

# Helper for slug generation (can be shared)
def generate_slug(value: str) -> str:
    s = value.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    return s

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[uuid.UUID] = None
    applicable_to: Optional[List[str]] = None  # Array of POI types this category applies to
    is_active: bool = True
    sort_order: int = 0
    is_main_category: bool = False

class CategoryCreate(CategoryBase):
    slug: Optional[str] = None
    poi_types: Optional[List[str]] = None  # Alias for applicable_to in frontend

    @model_validator(mode='before')
    @classmethod
    def generate_slug_from_name(cls, values):
        if isinstance(values, dict):
            if not values.get('slug') and values.get('name'):
                values['slug'] = generate_slug(values['name'])
            # Map poi_types to applicable_to for frontend compatibility
            if values.get('poi_types') and not values.get('applicable_to'):
                values['applicable_to'] = values['poi_types']
        return values

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    applicable_to: Optional[List[str]] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    is_main_category: Optional[bool] = None

class Category(CategoryBase):
    id: uuid.UUID
    slug: str
    model_config = ConfigDict(from_attributes=True)

# Recursive schema for nested display
class CategoryWithChildren(Category):
    children: List['CategoryWithChildren'] = []
    poi_types: Optional[List[str]] = None  # Alias for applicable_to
    
    @model_validator(mode='after')
    def set_poi_types(self):
        self.poi_types = self.applicable_to
        return self
