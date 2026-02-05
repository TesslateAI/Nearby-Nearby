import uuid
import re
from typing import Optional
from pydantic import BaseModel, model_validator, ConfigDict


def generate_slug(value: str) -> str:
    s = value.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    s = re.sub(r'^-+|-+$', '', s)
    return s


class PrimaryTypeBase(BaseModel):
    name: str
    description: Optional[str] = None


class PrimaryTypeCreate(PrimaryTypeBase):
    slug: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def generate_slug_from_name(cls, values):
        if isinstance(values, dict):
            if not values.get('slug') and values.get('name'):
                values['slug'] = generate_slug(values['name'])
        return values


class PrimaryTypeUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None


class PrimaryType(PrimaryTypeBase):
    id: uuid.UUID
    slug: str
    model_config = ConfigDict(from_attributes=True)
