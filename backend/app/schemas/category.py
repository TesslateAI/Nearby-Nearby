import uuid
from typing import List, Optional
from pydantic import BaseModel, model_validator
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

class CategoryCreate(CategoryBase):
    slug: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def generate_slug_from_name(cls, values):
        if isinstance(values, dict):
             if not values.get('slug') and values.get('name'):
                values['slug'] = generate_slug(values['name'])
        return values

class Category(CategoryBase):
    id: uuid.UUID
    slug: str

    class Config:
        from_attributes = True

# Recursive schema for nested display
class CategoryWithChildren(Category):
    children: List['CategoryWithChildren'] = []
