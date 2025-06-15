# This file makes it possible to import schemas like:
# from app.schemas import PointOfInterest
# instead of the more verbose:
# from app.schemas.poi import PointOfInterest

from .poi import PointOfInterest, PointOfInterestCreate, PointOfInterestUpdate, Location, LocationCreate
# FIX: Add the new category schemas to the package's namespace
from .category import Category, CategoryCreate, CategoryWithChildren
