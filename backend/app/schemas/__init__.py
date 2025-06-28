# This file makes it possible to import schemas like:
# from app.schemas import PointOfInterest
# instead of the more verbose:
# from app.schemas.poi import PointOfInterest

from .poi import PointOfInterest, PointOfInterestCreate, PointOfInterestUpdate, Business, Park, Trail, Event, POIRelationship, POIRelationshipCreate
from .category import Category, CategoryCreate, CategoryUpdate, CategoryWithChildren
from .attribute import Attribute, AttributeCreate, AttributeUpdate
from .user import User, UserCreate, UserUpdate, Token, TokenData
