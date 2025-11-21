# ProjectDashbored - Job Hunter Application

A Spring Boot application that aggregates job postings from multiple job search APIs and provides a unified dashboard for job seekers with automated job fetching and Redis caching.

## Features

- **Job Search API Integration**: Fetches jobs from Adzuna API with multi-page support
- **Automated Job Fetching**: Scheduled service runs every 15 seconds to fetch new jobs based on saved queries
- **Redis Caching**: Caches job IDs and URLs for fast retrieval
- **Saved Queries**: Store and manage search parameters for automated fetching
- **Database Persistence**: PostgreSQL database with normalized schema
- **REST API**: Full CRUD operations for jobs and saved queries

## Tech Stack

- **Framework**: Spring Boot 3.5.7
- **Java**: 17
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Build Tool**: Maven
- **Containerization**: Docker & Docker Compose

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client / User                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JobSearchController                           │
│  - POST /api/jobs/saved-queries (Create saved query)            │
│  - GET  /api/jobs/search (Manual search)                        │
│  - GET  /api/jobs/saved-queries (List saved queries)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ScheduledJobFetchService                      │
│  @Scheduled(fixedRate = 15000) - Runs every 15 seconds          │
│  1. Fetch active saved queries from database                    │
│  2. For each query: call Adzuna API (5 pages)                   │
│  3. Save jobs to PostgreSQL                                     │
│  4. Cache job IDs + URLs to Redis                               │
└────────────┬───────────────────────────┬────────────────────────┘
             │                           │
             ▼                           ▼
┌─────────────────────┐     ┌────────────────────────────────────┐
│   AdzunaClient      │     │      JobMapper                     │
│  - buildUri()       │     │  - Convert JobDto → JobEntity      │
│  - Multi-page fetch │     │  - Lookup/create companies         │
│  - Rate limiting    │     │  - Lookup/create locations         │
└─────────────────────┘     │  - Lookup/create categories        │
                            └────────────────────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    ▼                                              ▼
        ┌────────────────────────┐                   ┌─────────────────────┐
        │   PostgreSQL Database  │                   │    Redis Cache      │
        │  - jobs                │                   │  Key: job:{id}      │
        │  - companies           │                   │  Value: URL         │
        │  - locations           │                   │                     │
        │  - categories          │                   └─────────────────────┘
        │  - saved_queries       │
        │  - applications        │
        │  - status_history      │
        └────────────────────────┘
```

## Data Flow

### 1. Manual Job Search Flow

```
User Request
    ↓
GET /api/jobs/search?query=java&location=Remote
    ↓
JobSearchController.searchJobs()
    ↓
JobSearchService.searchJobs()
    ↓
AdzunaClient.getResponseEntity()
    ↓
Build SearchParamsDto with defaults:
  - resultsPerPage: 100
  - fullTime: 1
  - page: 1-5 (loops through 5 pages)
    ↓
For each page:
  - Fetch from Adzuna API
  - Parse JSON to List<JobDto>
  - Check if job exists (by externalId)
  - If new: JobMapper.toEntity() → Save to DB
    ↓
Return JSON response
```

### 2. Automated Job Fetching Flow (Every 15 Seconds)

```
@Scheduled(fixedRate = 15000)
    ↓
ScheduledJobFetchService.fetchAndCacheJobs()
    ↓
Fetch active saved queries from database:
  SELECT * FROM saved_queries WHERE is_active = true
    ↓
For each SavedQuery:
  ├─ Query parameters: {query, location, resultsPerPage, fullTime, excludedTerms}
  ├─ Call jobSearchService.searchJobs(query, location)
  │    ├─ Fetch 5 pages from Adzuna API
  │    ├─ Save new jobs to PostgreSQL
  │    └─ Return JSON response
  │
  ├─ cacheJobUrls(response)
  │    ├─ Parse JSON response
  │    ├─ For each job in results:
  │    │    └─ Redis SET job:{jobId} → redirect_url
  │    └─ Log: "Cached X job URLs in Redis"
  │
  └─ Update saved_queries.last_run_at = NOW()
```

### 3. Saved Query CRUD Flow

```
POST /api/jobs/saved-queries
    ↓
{
  "query": "java developer",
  "location": "Remote",
  "resultsPerPage": 100,
  "fullTime": 1,
  "isActive": true
}
    ↓
Check if query+location already exists
    ↓
Save to saved_queries table
    ↓
Return created SavedQuery with ID
```

## Database Schema

### Core Tables

**jobs** - Main job postings
- `id` (BIGSERIAL) - Primary key
- `external_id` (VARCHAR) - Adzuna job ID (unique)
- `title`, `description`, `job_url`
- `company_id` → companies(id)
- `location_id` → locations(id)
- `category_id` → categories(id)
- `salary_min`, `salary_max`
- `created_date`, `date_found`, `apply_by`

**saved_queries** - Stored search parameters
- `id` (BIGSERIAL) - Primary key
- `query` (VARCHAR) - Search keywords
- `location` (VARCHAR) - Job location
- `results_per_page` (INTEGER) - Default 100
- `full_time` (INTEGER) - Default 1
- `excluded_terms` (VARCHAR) - Optional exclusions
- `is_active` (BOOLEAN) - Enable/disable query
- `last_run_at` (TIMESTAMP) - Last fetch time

**companies, locations, categories** - Normalized lookup tables

**applications** - Track job applications (auto-created via trigger)

**status_history** - Track application status changes (auto-created via trigger)

### Database Triggers

1. **Auto-create Application**: When a job is inserted, automatically creates an application record
2. **Track Status Changes**: When application status changes, logs to status_history

## Redis Cache Structure

```
Key Pattern: job:{jobId}
Value: Adzuna redirect URL

Example:
SET job:5354569383 "https://www.adzuna.com/land/ad/5354569383?..."
```

**Cache Behavior**:
- Populated by ScheduledJobFetchService every 15 seconds
- No expiration set (manual cleanup required)
- Used for quick job URL retrieval without database query

## API Endpoints

### Job Search

**GET** `/api/jobs/search`
- **Query Params**: `query` (required), `location` (required)
- **Response**: JSON array of job postings
- **Example**: `/api/jobs/search?query=python&location=New York`

### Saved Queries

**GET** `/api/jobs/saved-queries`
- **Response**: All saved queries ordered by last_run_at

**GET** `/api/jobs/saved-queries/active`
- **Response**: Only active saved queries

**GET** `/api/jobs/saved-queries/{id}`
- **Response**: Specific saved query by ID

**POST** `/api/jobs/saved-queries`
- **Body**:
```json
{
  "query": "software engineer",
  "location": "San Francisco",
  "resultsPerPage": 50,
  "fullTime": 1,
  "isActive": true
}
```
- **Response**: Created saved query with ID

**PUT** `/api/jobs/saved-queries/{id}`
- **Body**: Updated saved query fields
- **Response**: Updated saved query

**PATCH** `/api/jobs/saved-queries/{id}/toggle`
- **Response**: Saved query with toggled isActive status

**DELETE** `/api/jobs/saved-queries/{id}`
- **Response**: 204 No Content

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Java 17+ (for local development)
- Maven (for local development)

### Running with Docker

1. **Start all services**:
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5433
- Redis on port 6379
- Spring Boot app on port 8080

2. **View logs**:
```bash
docker-compose logs -f app
```

3. **Stop services**:
```bash
docker-compose down
```

4. **Clean restart** (removes volumes):
```bash
docker-compose down -v
docker-compose up --build -d
```

### Running Locally

1. **Start database and Redis**:
```bash
docker-compose up -d postgres redis
```

2. **Build and run Spring Boot**:
```bash
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```

## Configuration

### Application Properties

```properties
# Adzuna API
adzuna.base-url=https://api.adzuna.com/v1/api/jobs/us/search/1
adzuna.api-id=YOUR_API_ID
adzuna.api-key=YOUR_API_KEY

# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5433/JobHunterDb2
spring.datasource.username=admin
spring.datasource.password=password

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379

# Scheduler (15 seconds)
# Configured via @Scheduled(fixedRate = 15000)
```

### Environment Variables

**Docker Compose** overrides:
- `SPRING_DATASOURCE_URL`
- `SPRING_REDIS_HOST`

## Usage Examples

### 1. Create a Saved Query

```bash
curl -X POST http://localhost:8080/api/jobs/saved-queries \
  -H "Content-Type: application/json" \
  -d '{
    "query": "java developer",
    "location": "Remote",
    "isActive": true
  }'
```

### 2. Manual Job Search

```bash
curl "http://localhost:8080/api/jobs/search?query=python&location=New%20York"
```

### 3. List Active Saved Queries

```bash
curl http://localhost:8080/api/jobs/saved-queries/active
```

### 4. Monitor Scheduler Logs

```bash
docker-compose logs -f app | grep "ScheduledJobFetchService"
```

You should see:
```
Starting scheduled job fetch at 2025-11-18T03:45:00
Found 2 active saved queries to process
Fetching jobs for query: 'java developer', location: 'Remote'
Cached 250 job URLs in Redis
Completed scheduled job fetch at 2025-11-18T03:45:15
```

### 5. Check Redis Cache

```bash
docker exec -it jobhunter-redis redis-cli
> KEYS job:*
> GET job:5354569383
```

## Project Structure

```
ProjectDashbored/
├── src/main/java/
│   ├── main/
│   │   └── JobSearchApplication.java      # Main entry point
│   ├── JobSearch/
│   │   ├── Controllers/
│   │   │   └── JobSearchController.java   # REST endpoints (consolidated)
│   │   ├── Services/
│   │   │   ├── JobSearchService.java      # Job search logic
│   │   │   ├── ScheduledJobFetchService.java  # Automated fetching
│   │   │   └── Implementations/
│   │   │       └── JobSearchImpl.java     # Service interface
│   │   ├── Clients/
│   │   │   ├── Client.java                # Abstract API client
│   │   │   ├── AdzunaClient.java          # Adzuna implementation
│   │   │   └── ClientConfig.java          # Client beans
│   │   └── Config/
│   │       └── RedisConfig.java           # Redis configuration
│   └── DbConnections/
│       ├── DTO/
│       │   ├── JobDto.java                # Adzuna API response
│       │   ├── SearchParamsDto.java       # Search parameters
│       │   └── Entities/
│       │       ├── JobEntity.java         # Job table
│       │       ├── SavedQuery.java        # Saved queries table
│       │       ├── Company.java           # Companies lookup
│       │       ├── Location.java          # Locations lookup
│       │       └── Category.java          # Categories lookup
│       ├── Repositories/
│       │   ├── JobRepository.java         # Job + SavedQuery repos (consolidated)
│       │   ├── CompanyRepository.java
│       │   ├── LocationRepository.java
│       │   └── CategoryRepository.java
│       └── JobMapper.java                 # DTO → Entity mapper
├── src/main/resources/
│   ├── application.properties             # Main configuration
│   └── application.yml                    # YAML configuration
├── init/
│   └── schema.sql                         # PostgreSQL schema
├── docker-compose.yml                     # Docker orchestration
├── Dockerfile                             # Multi-stage build
└── pom.xml                                # Maven dependencies
```

## Key Design Decisions

### 1. Controller Consolidation
All job-related endpoints are in `JobSearchController` to keep job search functionality tightly coupled and reduce test complexity.

### 2. Repository Consolidation
`JobRepository.java` contains both `JobRepository` and `SavedQueryRepository` interfaces in the same file for cohesion, while maintaining separate entity management.

### 3. Saved Queries = Search Parameters
The `SavedQuery` entity mirrors `SearchParamsDto` fields (query, location, resultsPerPage, fullTime, excludedTerms) to store complete search configurations, not just keywords.

### 4. Scheduler Rate
Set to 15 seconds (fixedRate = 15000) for testing. Production should use longer intervals (e.g., 1 hour or daily cron).

### 5. Redis Caching
Only caches `job:{id}` → URL mappings for fast retrieval. Full job data is stored in PostgreSQL.

### 6. Multi-Page Fetching
Automatically fetches 5 pages (50 results × 5 = 250 jobs) per query to maximize data collection.

### 7. Duplicate Prevention
Uses `external_id` (Adzuna job ID) as unique constraint to prevent duplicate jobs.

## Troubleshooting

### Scheduler Not Running

Check logs for:
```
Starting scheduled job fetch at ...
```

If missing, verify `@EnableScheduling` is on `JobSearchApplication.java`.

### Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker exec -it jobhunter-redis redis-cli ping
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker exec -it jobhunter-postgres psql -U admin -d JobHunterDb2 -c "SELECT 1;"
```

### Lombok Getters/Setters Not Found

Ensure `pom.xml` has:
```xml
<annotationProcessorPaths>
    <path>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.34</version>
    </path>
</annotationProcessorPaths>
```

### Schema Changes Not Applied

```bash
# Recreate database from scratch
docker-compose down -v
docker-compose up -d
```

## Future Enhancements

- [ ] Add more job API providers (Indeed, LinkedIn, etc.)
- [ ] Implement job application workflow
- [ ] Add user authentication and multi-tenancy
- [ ] Build frontend dashboard
- [ ] Add job filtering and sorting
- [ ] Implement email notifications for new jobs
- [ ] Add job similarity matching
- [ ] Create analytics dashboard

## Contributing

1. Follow existing code structure (PascalCase packages, consolidated controllers/repos)
2. Use Lombok annotations for DTOs and entities
3. Add logging for all service methods
4. Update schema.sql for any database changes
5. Run `docker-compose down -v` after schema changes

## License

[Your License Here]

## Contact

[Your Contact Information]
