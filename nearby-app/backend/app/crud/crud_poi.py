# app/crud/crud_poi.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, literal_column, select, and_
from geoalchemy2 import Geography
from .. import models
from ..schemas.poi import PointGeometry

def _enrich_poi_with_category_info(db: Session, poi: models.poi.PointOfInterest) -> None:
    """
    Safely populate main_category and secondary_categories on a POI instance.
    Uses the is_main flag from poi_category_association table.
    """
    from ..models.poi import poi_category_association
    from ..models.poi import Category

    # Query for main category (is_main=True)
    main_cat_stmt = select(Category).join(
        poi_category_association,
        Category.id == poi_category_association.c.category_id
    ).where(
        and_(
            poi_category_association.c.poi_id == poi.id,
            poi_category_association.c.is_main == True
        )
    )
    main_cat = db.execute(main_cat_stmt).first()

    # Query for secondary categories (is_main=False)
    secondary_cats_stmt = select(Category).join(
        poi_category_association,
        Category.id == poi_category_association.c.category_id
    ).where(
        and_(
            poi_category_association.c.poi_id == poi.id,
            poi_category_association.c.is_main == False
        )
    )
    secondary_cats = [row[0] for row in db.execute(secondary_cats_stmt).all()]

    # Set as instance attributes for serialization
    poi.__dict__['main_category'] = main_cat[0] if main_cat else None
    poi.__dict__['secondary_categories'] = secondary_cats

def get_poi(db: Session, poi_id: str):
    poi = db.query(models.poi.PointOfInterest).options(
        joinedload(models.poi.PointOfInterest.business),
        joinedload(models.poi.PointOfInterest.park),
        joinedload(models.poi.PointOfInterest.trail),
        joinedload(models.poi.PointOfInterest.event),
        joinedload(models.poi.PointOfInterest.categories)
    ).filter(
        models.poi.PointOfInterest.id == poi_id,
        models.poi.PointOfInterest.publication_status == 'published'
    ).first()

    if poi:
        _enrich_poi_with_category_info(db, poi)

    return poi

def get_nearby_pois(db: Session, poi_id: str, radius_miles: float = 5.0):
    from geoalchemy2.shape import to_shape

    origin_poi = db.query(models.poi.PointOfInterest).filter(models.poi.PointOfInterest.id == poi_id).first()
    if not origin_poi:
        return []

    # Extract coordinates from origin POI
    origin_point = to_shape(origin_poi.location)
    origin_lon = origin_point.x
    origin_lat = origin_point.y

    # Convert miles to meters (1 mile = 1609.34 meters)
    radius_meters = radius_miles * 1609.34

    # Use geography type for accurate distance in meters
    distance_expr = literal_column(
        f"ST_Distance(location::geography, ST_MakePoint({origin_lon}, {origin_lat})::geography)"
    )

    nearby_pois_with_distance = db.query(
        models.poi.PointOfInterest,
        distance_expr.label('distance_meters')
    ).filter(
        models.poi.PointOfInterest.id != poi_id,
        models.poi.PointOfInterest.publication_status == 'published',
        distance_expr <= radius_meters
    ).order_by('distance_meters').all()

    # The query returns tuples of (PointOfInterest, distance), so we need to format them.
    results = []
    for poi, distance in nearby_pois_with_distance:
        poi.distance_meters = distance
        _enrich_poi_with_category_info(db, poi)
        results.append(poi)

    return results