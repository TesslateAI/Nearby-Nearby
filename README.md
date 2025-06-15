# Nearby Nearby MVP

This repository contains the complete source code for the "Nearby Nearby" Minimum Viable Product (MVP). It features a full-stack application for managing geospatial Points of Interest (POIs), built with a modern, containerized architecture.

## Key Technologies

-   **Backend:** FastAPI (Python)
-   **Frontend:** React (Vite) with Mantine UI components
-   **Database:** PostgreSQL with PostGIS extension for geographic data
-   **ORM:** SQLAlchemy with GeoAlchemy2
-   **Containerization:** Docker & Docker Compose
-   **Database Migrations:** Alembic
-   **Testing:** Pytest

## Architecture

The application is fully containerized using Docker Compose and is split into several services:

-   **`frontend`**: A React single-page application built with Vite that serves as the admin dashboard. It allows users to create, view, and delete POIs.
-   **`backend`**: A FastAPI application that provides a RESTful API for all POI operations. It handles business logic, data validation (Pydantic), and communication with the database.
-   **`db`**: The primary PostgreSQL database instance with the PostGIS extension enabled. It persists all application data for the development environment.
-   **`test` & `test-db`**: A completely separate and isolated set of containers used exclusively for running the automated test suite. This ensures that testing does not interfere with the development database.

## Prerequisites

Before you begin, ensure you have the following installed on your system:
*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Running the Development Environment

These instructions will start the frontend, backend, and development database.

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <your-repository-url>
    cd nearby-nearby-mvp
    ```

2.  **Build and start all services:**
    Run the following command from the root of the project directory. The `--build` flag is only necessary the first time or after changing dependencies (like `requirements.txt`).
    ```bash
    docker-compose up --build
    ```

### What Happens Next?

-   Docker will build the images for the `frontend` and `backend` services.
-   The `db` container will start and initialize the PostgreSQL database.
-   The `backend` container will wait for the database to be healthy, then run any pending Alembic database migrations automatically, and finally start the Uvicorn web server.
-   The `frontend` container will start the Vite development server.

### Accessing the Services

Once all containers are running, you can access the different parts of the application:

-   **Admin Frontend:** Open your browser to [http://localhost:5173](http://localhost:5173)
-   **Backend API Docs:** Open your browser to [http://localhost:8000/docs](http://localhost:8000/docs). This is an interactive API documentation page (Swagger UI) where you can explore and test the API endpoints directly.

## Running the Automated Tests

The project includes a robust, isolated testing environment. Tests run against a separate, temporary PostGIS database to ensure they are reliable and do not affect your development data.

1.  **Ensure your Docker daemon is running.** (Your development containers can be running or stopped; it doesn't matter).

2.  **Execute the test suite:**
    From the project's root directory, run the following command in your terminal:
    ```bash
    docker-compose run --rm test
    ```
    This command spins up temporary `test` and `test-db` containers, runs `pytest` inside the `test` container, prints the output, and then automatically removes the containers.

3.  **Expected Output:**
    You should see a summary indicating that all tests have passed.
    ```
    ============================= test session starts ==============================
    ...
    tests/test_pois_api.py ....                                      [100%]
    ============================== 4 passed in ...s ===============================
    ```

## Database Migrations (Alembic)

The application uses Alembic to manage database schema changes. Migrations are run automatically when the `backend` service starts.

If you make changes to the SQLAlchemy models in `backend/app/models/`, you will need to generate a new migration file.

1.  **Ensure the development services are running** (`docker-compose up`).
2.  **Open a new terminal** and run the following command to generate a new migration script. Replace `"your_descriptive_message"` with a short summary of your changes.
    ```bash
    docker-compose exec backend alembic revision --autogenerate -m "your_descriptive_message"
    ```
3.  A new migration file will be created in `backend/alembic/versions/`. The next time you run `docker-compose up`, this migration will be applied automatically.