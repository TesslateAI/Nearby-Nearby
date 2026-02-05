# Nearby Nearby - Geospatial Points of Interest Platform

A comprehensive full-stack application for managing geospatial Points of Interest (POIs) with advanced relationship management, dynamic attribute systems, and both public-facing and administrative interfaces.

## 🚀 Key Features

### **Multi-Type POI Management**
- **Business POIs**: Restaurants, shops, services with pricing tiers and business-specific attributes
- **Park POIs**: Public parks with drone policies and outdoor amenities
- **Trail POIs**: Hiking trails with difficulty levels, route types, and length information
- **Event POIs**: Time-based events with start/end times and cost information

### **Advanced Relationship System**
- **Smart Relationship Types**: Venue, trail-in-park, service provider, vendor, sponsor, and general relationships
- **Type-Based Validation**: Ensures relationships make sense (e.g., events can only have businesses/parks as venues)
- **Bidirectional Management**: View and manage relationships from both source and target perspectives

### **Dynamic Attribute & Category Management**
- **Hierarchical Categories**: Parent-child category relationships with nested subcategories
- **Flexible Attributes**: Dynamic form fields for payment methods, amenities, accessibility features, and more
- **POI-Type Specific**: Attributes and categories can be configured to apply only to specific POI types
- **Admin-Configurable**: Add new options without code changes through the admin interface

### **Geospatial Features**
- **PostGIS Integration**: Advanced geographic queries and spatial indexing
- **Interactive Maps**: Leaflet-based mapping with custom markers and tooltips
- **Location Search**: Find POIs by location name or coordinates
- **Nearby Discovery**: Find related POIs within configurable distances

### **Public & Admin Interfaces**
- **Public Detail Pages**: Rich, detailed POI pages with photos, hours, amenities, and related content
- **Interactive Homepage**: Search by location with dynamic results
- **Admin Dashboard**: Comprehensive management interface for all POI types
- **Authentication System**: JWT-based secure login with role-based access

### **Rich Data Model**
- **Flexible JSONB Fields**: Photos, hours, amenities, contact info, compliance data, and custom fields
- **Comprehensive Metadata**: Status tracking, verification flags, disaster hub designation
- **Contact Information**: Phone, email, website, and structured contact data
- **Media Management**: Featured photos and gallery support

## 🛠 Technology Stack

### **Backend**
- **Framework**: FastAPI (Python 3.10)
- **Database**: PostgreSQL 15 + PostGIS extension
- **ORM**: SQLAlchemy + GeoAlchemy2
- **Authentication**: JWT with bcrypt password hashing
- **API Documentation**: Auto-generated Swagger/OpenAPI
- **Testing**: Pytest with isolated test database

### **Frontend**
- **Framework**: React 18 + Vite
- **UI Library**: Mantine 7.8
- **Maps**: Leaflet + React Leaflet
- **Routing**: React Router
- **State Management**: React Context for authentication

### **Infrastructure**
- **Containerization**: Docker + Docker Compose
- **Database Migrations**: Alembic
- **Development Environment**: Isolated test containers

## 🏗 Architecture

The application uses a microservices architecture with four main services:

- **`frontend`**: React SPA serving both public and admin interfaces
- **`backend`**: FastAPI application with comprehensive REST API
- **`db`**: PostgreSQL with PostGIS for development data
- **`test` & `test-db`**: Isolated testing environment with separate database

## 🚀 Quick Start

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Development Environment

1. **Clone and start services:**
   ```bash
   git clone <your-repository-url>
   cd nearby-nearby
   docker-compose up --build
   ```

2. **Access the application:**
   - **Admin Interface**: [http://localhost:5173](http://localhost:5173)
   - **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Public POI Pages**: [http://localhost:5173/poi/detail/{id}](http://localhost:5173/poi/detail/{id})

3. **Default Admin Login:**
   - **Email**: `test@nearbynearby.com`
   - **Password**: `1234`

### Running Tests

```bash
# Run the complete test suite
docker-compose run --rm test
```

## 📊 Core Functionality

### **POI Management**
- Create, edit, and delete POIs of all four types
- Dynamic forms that adapt based on POI type
- Rich media upload and management
- Geographic coordinate management with map integration
- Status tracking and verification workflows

### **Relationship Management**
- Create meaningful connections between POIs
- Type-safe relationship validation
- Visual relationship management interface
- Related POI discovery and navigation

### **Category & Attribute System**
- Hierarchical category management
- Dynamic attribute configuration
- POI-type specific attribute assignment
- Flexible form generation based on admin configuration

### **Search & Discovery**
- Location-based POI search
- Geospatial proximity queries
- Category and attribute filtering
- Full-text search capabilities

### **Public Interface**
- Rich POI detail pages with comprehensive information
- Interactive maps with custom markers
- Related POI discovery
- Mobile-responsive design

## 🔧 Development

### **Database Migrations**
```bash
# Generate new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations (automatic on startup)
docker-compose up backend
```

### **User Management**
```bash
# Create new admin user
docker-compose exec backend python scripts/manage_users.py create admin@example.com password123

# List all users
docker-compose exec backend python scripts/manage_users.py list

# Create test user
docker-compose exec backend python scripts/manage_users.py test-user
```

### **API Endpoints**

#### **POI Management**
- `GET /api/pois/` - List all POIs
- `POST /api/pois/` - Create new POI
- `GET /api/pois/{id}` - Get POI details
- `PUT /api/pois/{id}` - Update POI
- `DELETE /api/pois/{id}` - Delete POI
- `GET /api/pois/search` - Text search
- `GET /api/pois/search-by-location` - Location-based search
- `GET /api/pois/{id}/nearby` - Find nearby POIs

#### **Relationships**
- `POST /api/relationships/` - Create relationship
- `GET /api/relationships/{poi_id}` - Get POI relationships
- `DELETE /api/relationships/{source}/{target}/{type}` - Delete relationship
- `GET /api/pois/{id}/related` - Get related POIs

#### **Categories & Attributes**
- `GET /api/categories/` - List categories
- `POST /api/categories/` - Create category
- `GET /api/attributes/` - List attributes
- `POST /api/attributes/` - Create attribute

#### **Authentication**
- `POST /api/auth/login` - User login
- `GET /api/auth/users/me` - Get current user

## 🎯 Use Cases

### **For Data Managers (Rhonda)**
- Rapid data entry for hundreds of POIs across multiple counties
- Dynamic form configuration without developer intervention
- Complex relationship management between venues, events, and services
- Comprehensive data validation and quality control

### **For End Users**
- Discover local businesses, parks, trails, and events
- Find related services and venues
- Interactive maps with detailed POI information
- Location-based search and discovery

### **For Administrators**
- Complete POI lifecycle management
- Category and attribute taxonomy management
- User access control and authentication
- Data quality monitoring and verification

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access**: Admin and user role support
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries via SQLAlchemy

## 📈 Scalability

- **PostGIS**: Advanced geospatial capabilities for large datasets
- **JSONB Fields**: Flexible schema evolution without migrations
- **Microservices**: Containerized architecture for easy scaling
- **Caching Ready**: Architecture supports Redis integration
- **API-First**: RESTful API enables mobile and third-party integration

## 🧪 Testing

- **Comprehensive Test Suite**: Unit and integration tests
- **Isolated Test Environment**: Separate database for testing
- **Automated Testing**: CI/CD ready test infrastructure
- **API Testing**: Full API endpoint coverage

This platform provides a complete solution for managing geospatial Points of Interest with advanced relationship management, dynamic data modeling, and both public and administrative interfaces.