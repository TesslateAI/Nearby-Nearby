# This file makes it possible to import CRUD functions like:
# from app.crud import create_poi
# instead of the more verbose:
# from app.crud.crud_poi import create_poi

from .crud_poi import get_poi, get_pois, create_poi, delete_poi