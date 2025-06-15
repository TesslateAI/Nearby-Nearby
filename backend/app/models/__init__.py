# This file makes it possible to import models like:
# from app.models import PointOfInterest
# instead of the more verbose:
# from app.models.poi import PointOfInterest

from .poi import PointOfInterest, Location, Business, Outdoors, Event
from .category import Category, poi_category_association
