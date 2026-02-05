from app.database import engine
from sqlalchemy import text

conn = engine.connect()

# Check total POIs
result = conn.execute(text('SELECT COUNT(*) FROM points_of_interest'))
total = result.scalar()
print(f'Total POIs: {total}')

# Check by publication status
result = conn.execute(text('SELECT publication_status, COUNT(*) FROM points_of_interest GROUP BY publication_status'))
print('\nBy publication status:')
for row in result:
    print(f'  {row[0]}: {row[1]}')

# Sample some POI names
result = conn.execute(text('SELECT name, publication_status FROM points_of_interest LIMIT 5'))
print('\nSample POIs:')
for row in result:
    print(f'  {row[0]} (status: {row[1]})')

conn.close()
