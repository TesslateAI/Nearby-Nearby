from app.database import engine
from sqlalchemy import text

conn = engine.connect()

# Check if categories table exists
result = conn.execute(text("""
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'categories'
"""))
table_exists = result.fetchone()

if table_exists:
    print("=" * 80)
    print("CATEGORIES TABLE")
    print("=" * 80)

    # Get total count
    result = conn.execute(text('SELECT COUNT(*) FROM categories'))
    total = result.scalar()
    print(f"\nTotal categories: {total}\n")

    # Get all categories
    result = conn.execute(text('''
        SELECT id, name, slug, parent_id, is_active, is_main_category, sort_order
        FROM categories
        ORDER BY sort_order, name
    '''))

    print(f"{'ID':<40} {'Name':<40} {'Slug':<30} {'Active':<8} {'Main':<6} {'Order':<6}")
    print("-" * 140)

    for row in result:
        category_id = str(row[0])
        name = row[1] or "N/A"
        slug = row[2] or "N/A"
        is_active = "Yes" if row[4] else "No"
        is_main = "Yes" if row[5] else "No"
        sort_order = row[6] if row[6] is not None else "N/A"

        print(f"{category_id:<40} {name:<40} {slug:<30} {is_active:<8} {is_main:<6} {sort_order:<6}")

    # Show parent-child relationships
    print("\n" + "=" * 80)
    print("CATEGORY HIERARCHY")
    print("=" * 80 + "\n")

    result = conn.execute(text('''
        SELECT c.id, c.name, c.parent_id, p.name as parent_name
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        ORDER BY p.name NULLS FIRST, c.name
    '''))

    current_parent = None
    for row in result:
        category_id = str(row[0])
        name = row[1] or "N/A"
        parent_id = str(row[2]) if row[2] else None
        parent_name = row[3]

        if parent_name != current_parent:
            current_parent = parent_name
            if parent_name:
                print(f"\nParent: {parent_name}")
            else:
                print(f"\nTop-level categories:")

        if parent_name:
            print(f"  -> {name} (ID: {category_id})")
        else:
            print(f"  * {name} (ID: {category_id})")

    # Show POI-Category associations
    print("\n" + "=" * 80)
    print("POI-CATEGORY ASSOCIATIONS")
    print("=" * 80 + "\n")

    result = conn.execute(text('''
        SELECT c.name, COUNT(pc.poi_id) as poi_count
        FROM categories c
        LEFT JOIN poi_categories pc ON c.id = pc.category_id
        GROUP BY c.id, c.name
        ORDER BY poi_count DESC, c.name
    '''))

    print(f"{'Category Name':<50} {'# of POIs':<10}")
    print("-" * 60)

    for row in result:
        category_name = row[0] or "N/A"
        poi_count = row[1]
        print(f"{category_name:<50} {poi_count:<10}")

else:
    print("No 'categories' table found in the database.")

conn.close()
