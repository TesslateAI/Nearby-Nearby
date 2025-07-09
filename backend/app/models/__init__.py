# This file makes it possible to import models like:
# from app.models import PointOfInterest
# instead of the more verbose:
# from app.models.poi import PointOfInterest

from .poi import PointOfInterest, POIRelationship, Business, Park, Trail, Event, POIType
from .category import Category, poi_category_association
from .attribute import Attribute
from .user import User
from app.database import Base
