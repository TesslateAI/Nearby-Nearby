# This file makes it possible to import CRUD functions like:
# from app.crud import create_poi
# instead of the more verbose:
# from app.crud.crud_poi import create_poi

from .crud_poi import get_poi, get_pois, create_poi, delete_poi, update_poi
# FIX: Add the new category crud functions to the package's namespace
from .crud_category import get_category, create_category, get_all_categories, get_all_categories_as_tree, delete_category