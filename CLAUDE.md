# CLAUDE.md - AI Assistant Guide for ProjectDashbored

---

## 🚀 SESSION HANDOFF - Latest Work (2026-01-09)

### What Was Just Completed

**Geographic Distance-Based Job Filtering** - Fully implemented and operational ✅

**Problem Solved**: Database was returning only 3 jobs when Adzuna returned hundreds because location string matching (`LIKE '%new york%'`) missed jobs in nearby cities (Brooklyn, Queens, Jersey City, etc.).

**Solution Implemented**: Geographic distance-based filtering using Haversine formula + automatic geocoding.

### Files Modified in This Session

1. **[init/schema.sql:49-50](init/schema.sql#L49-L50)** - Added `latitude` and `longitude` columns to locations table + indexes
2. **[Location.java:38-42](backend/src/main/java/DbConnections/DTO/Entities/Location.java#L38-L42)** - Added lat/lon fields
3. **[GeocodingService.java](backend/src/main/java/JobSearch/Services/GeocodingService.java)** - **NEW FILE** - Nominatim API integration, Redis caching
4. **[JobRepository.java:43-55](backend/src/main/java/DbConnections/Repositories/JobRepository.java#L43-L55)** - Added `findByQueryAndDistance()` with Haversine formula
5. **[JobMapper.java:88-103](backend/src/main/java/DbConnections/JobMapper.java#L88-L103)** - Integrated geocoding in `findOrCreateLocation()`
6. **[JobSearchService.java:192-218](backend/src/main/java/JobSearch/Services/JobSearchService.java#L192-L218)** - Smart query selection (geocoding → distance or fallback)
7. **[JobSearchController.java:59-71](backend/src/main/java/JobSearch/Controllers/JobSearchController.java#L59-L71)** - Pass distance parameter

### How It Works Now

**API Request**: `GET /api/jobs/search?query=developer&location=New York&distance=25`

**Flow**:
1. Fetch jobs from Adzuna (within 25 miles of New York)
2. Save jobs to database with automatic geocoding:
   - Geocode "Brooklyn, NY" → (40.6782, -73.9442)
   - Store in locations table with coordinates
3. Query database:
   - Geocode "New York" → (40.7128, -74.0060)
   - Use Haversine formula: `3959 * acos(cos(radians(centerLat)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians(centerLon)) + sin(radians(centerLat)) * sin(radians(l.latitude)))`
   - Return all jobs within 25 miles (includes Brooklyn, Queens, Jersey City, etc.)
4. Apply filters: exclude terms, date range
5. Return results

**Result**: Now returns hundreds of jobs instead of 3!

### Database Schema Changes

**IMPORTANT**: Database was recreated with `docker-compose down -v && docker-compose up -d`

```sql
-- locations table NOW has:
CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(2) NOT NULL,
    display_name VARCHAR(255) NOT NULL UNIQUE,
    latitude DOUBLE PRECISION,        -- NEW!
    longitude DOUBLE PRECISION        -- NEW!
);

CREATE INDEX idx_locations_latitude ON locations(latitude);    -- NEW!
CREATE INDEX idx_locations_longitude ON locations(longitude);  -- NEW!
```

### Key Implementation Details

**GeocodingService**:
- Uses Nominatim (OpenStreetMap) - **free, no API key**
- Cached with `@Cacheable("geocoding")`
- Returns `Coordinates` class (Serializable for Redis)
- Has default constructor for Jackson deserialization

**Haversine Distance Query**:
- Native SQL query in `JobRepository.findByQueryAndDistance()`
- Calculates distance in miles on-the-fly
- Uses LEFT JOIN to include jobs with null coordinates

**Smart Fallback**:
- Try geocoding first
- If successful: use distance-based query
- If fails: fall back to string matching

### Additional Filters Implemented

1. **Exclude Terms**: `excludedTerms=senior,lead` - Filters out jobs containing these terms
2. **Date Range**: `dateFrom=2025-01-01&dateTo=2025-01-31` - Filters by job creation date
3. **Distance**: `distance=50` - Search radius in miles (default: 25)

### Testing

```bash
# Basic search
curl "http://localhost:8080/api/jobs/search?query=developer&location=New York"

# With all filters
curl "http://localhost:8080/api/jobs/search?query=developer&location=Boston&distance=30&excludedTerms=senior&dateFrom=2025-01-01"
```

### Current Status

✅ **All features working**:
- Geographic distance filtering
- Automatic geocoding
- Exclude terms filtering
- Date range filtering
- Redis caching (geocoding + job search results)
- Database persistence with lat/lon coordinates

✅ **Documentation updated**:
- CLAUDE.md - Full implementation details
- README.md - API examples and features

### Known Issues / Considerations

1. **Nominatim Rate Limits**: Free tier has usage limits - caching mitigates this
2. **Geocoding Accuracy**: Some locations may not geocode perfectly - falls back gracefully
3. **Performance**: Haversine calculation in SQL is efficient with indexes on lat/lon

### Next Session Should Focus On

1. **Testing**: Write tests for GeocodingService and distance queries
2. **Error Handling**: Add better error messages if geocoding consistently fails
3. **Monitoring**: Add metrics for geocoding success/failure rates
4. **Frontend Integration**: Update frontend to use new distance/filter parameters

### Important Notes for Next Assistant

- Database schema is managed by `init/schema.sql` (not Hibernate)
- After schema changes: `docker-compose down -v && docker-compose up -d`
- Redis caching is enabled for both "geocoding" and "jobSearch"
- All new locations are automatically geocoded when jobs are saved
- The system gracefully handles geocoding failures

---

## Project Overview

**ProjectDashbored** (also known as JobHunter1) is a Spring Boot application designed to aggregate job postings from multiple job search APIs and provide a unified dashboard for job seekers. The application currently integrates with the Adzuna API and is architected to support additional job search providers in the future.

### Tech Stack
- **Framework**: Spring Boot 3.5.7
- **Java Version**: 17
- **Build Tool**: Maven
- **Key Dependencies**:
  - Spring Boot Starter Web (REST API)
  - Spring Boot Starter Data JPA (ORM)
  - Spring Boot Starter JDBC (Database connectivity)
  - Spring Boot Starter Validation (DTO validation)
  - Lombok (Boilerplate reduction)
  - Spring Boot DevTools (Development utilities)

### Current Status
- ✅ Job search functionality is implemented with Adzuna API integration
- ✅ Database is FULLY CONFIGURED and OPERATIONAL with PostgreSQL backend
- ✅ Normalized database schema with foreign key relationships (BIGSERIAL IDs)
- ✅ Automatic data persistence from Adzuna API to database
- ✅ HikariCP connection pooling configured
- ✅ Schema fully managed by init/schema.sql (hibernate ddl-auto=none)
- ✅ Optimistic locking exception RESOLVED
- ✅ **Geographic distance-based filtering with automatic geocoding** - NEW!
- ✅ **Exclude terms filtering for job searches** - NEW!
- ✅ **Date range filtering for job searches** - NEW!
- 🚧 Dashboard backend services are stubbed but not fully implemented
- 🚧 Test structure exists but tests are not yet written

---

## Architecture & Directory Structure

### Package Organization

```
src/
├── main/
│   ├── java/
│   │   ├── main/                              # Main application entry point
│   │   │   └── JobSearchApplication.java      # Active Spring Boot application
│   │   ├── JobSearch/                         # Job search module (ACTIVE)
│   │   │   ├── Clients/                       # External API clients
│   │   │   │   ├── Client.java                # Abstract base client
│   │   │   │   ├── AdzunaClient.java          # Adzuna API implementation
│   │   │   │   └── ClientConfig.java          # Client beans configuration
│   │   │   ├── Controllers/                   # REST endpoints
│   │   │   │   └── JobSearchController.java   # Job search API
│   │   │   └── Services/                      # Business logic
│   │   │       ├── JobSearchService.java      # Service implementation
│   │   │       ├── GeocodingService.java      # Geocoding service (Nominatim API)
│   │   │       └── Implementations/
│   │   │           └── JobSearchImpl.java     # Service interface
│   │   ├── DashBoardBackend/                  # Dashboard module (STUB)
│   │   │   ├── Clients/
│   │   │   │   └── JobDashBoardApis.java
│   │   │   └── Services/
│   │   │       ├── JobDashBoredService.java   # Stub service
│   │   │       └── Implementations/
│   │   │           └── JoabBoardImpl.java
│   │   ├── DbConnections/                     # Database layer
│   │   │   ├── DbConnectionUtility.java
│   │   │   ├── JobMapper.java                 # Maps API DTOs to entities
│   │   │   ├── DTO/
│   │   │   │   ├── JobDto.java                # Adzuna API response DTO
│   │   │   │   ├── SearchParamsDto.java       # Job search parameters
│   │   │   │   └── Entities/                  # JPA entities
│   │   │   │       ├── JobEntity.java         # Job table
│   │   │   │       ├── Company.java           # Companies table
│   │   │   │       ├── Location.java          # Locations table
│   │   │   │       └── Category.java          # Categories table
│   │   │   └── Repositories/                  # JPA repositories
│   │   │       ├── JobRepository.java
│   │   │       ├── CompanyRepository.java
│   │   │       ├── LocationRepository.java
│   │   │       └── CategoryRepository.java
│   │   └── com/example/jobhunter1/            # Original package
│   │       └── JobHunter1Application.java     # Inactive entry point
│   └── resources/
│       ├── application.properties             # Primary configuration
│       ├── application.yml                    # YAML configuration
│       └── ClientConfigurations.env           # Environment variables
├── init/
│   └── schema.sql                             # PostgreSQL schema with triggers/views
└── test/
    └── Test/com/example/jobhunter1/
        └── JobSearchTests/
            └── ClientsTests/
                └── AdzunaClientTest.java      # Empty test class

```

### Architectural Patterns

1. **Layered Architecture**:
   - **Controllers**: Handle HTTP requests/responses
   - **Services**: Contain business logic
   - **Clients**: Manage external API interactions
   - **DTOs**: Data transfer between layers

2. **Abstract Client Pattern**:
   - Base `Client` class defines contract for all API clients
   - Each API provider extends `Client` with specific implementation
   - Enables easy addition of new job search APIs

3. **Dependency Injection**:
   - Spring's constructor-based dependency injection
   - Configuration beans in `@Configuration` classes

4. **Normalized Database Schema**:
   - Separate tables for companies, locations, and categories
   - Jobs table uses foreign keys to reference lookup tables
   - Automatic lookup/create pattern in `JobMapper`
   - Prevents data duplication and maintains referential integrity

---

## Key Components

### 1. Application Entry Points

#### Active: `JobSearchApplication.java` (src/main/java/main/JobSearchApplication.java)
```java
@SpringBootApplication
@ComponentScan(basePackages = {"JobSearch", "DbConnections", "DashBoardBackend"})
@EnableRetry
@EnableTransactionManagement
```
- **Current main application**
- ✅ Database is ENABLED with PostgreSQL
- Scans `JobSearch`, `DbConnections`, and `DashBoardBackend` packages
- `@EnableRetry` for handling transient failures
- `@EnableTransactionManagement` for database operations
- Located in `main` package (non-standard location)

#### Inactive: `JobHunter1Application.java`
- Standard Spring Boot application in `com.example.jobhunter1`
- Not currently used but may be activated later

### 2. REST API Endpoints

**Base URL**: `/api/jobs`

#### GET /api/jobs/search
- **Parameters**:
  - `query` (required): Job title or keywords
  - `location` (required): Job location
- **Returns**: JSON string of job results from Adzuna
- **Controller**: `JobSearch.Controllers.JobSearchController`
- **Handler**: `JobSearchController:24`

### 3. Job Search Client System

#### Abstract Client (`JobSearch.Clients.Client`)
Base class providing:
- Logging via SLF4J
- Abstract methods for URI building and API requests
- `logRequest()` utility method

#### Adzuna Client (`JobSearch.Clients.AdzunaClient`)
- **Purpose**: Integrates with Adzuna Job Search API
- **Configuration**: Injected via `ClientConfig.java`
- **Key Methods**:
  - `buildUri(SearchParamsDto)`: Constructs API request URI
  - `getResponseEntity(SearchParamsDto)`: Executes API call
- **Hardcoded Settings**:
  - `results_per_page`: 100 (line 34)
  - Base URL uses US job market: `/jobs/us/search/1`

#### Client Configuration (`JobSearch.Clients.ClientConfig`)
- Defines `RestTemplate` bean
- Configures `AdzunaClient` with credentials from properties:
  - `adzuna.base-url`
  - `adzuna.api-key`
  - `adzuna.api-id`

### 4. Data Transfer Objects

#### SearchParamsDto (`DbConnections.DTO.SearchParamsDto`)
- Uses Lombok annotations: `@Builder`, `@Getter`, `@Setter`
- **Fields**:
  - `query`: Job search keywords (required, validated)
  - `Location`: Geographic location (required, validated) - **Note**: Capital 'L'
  - `resultsPerPage`: 1-100, default 100
  - `fullTime`: Filter flag, default 1
  - `excludedTerms`: Optional exclusion filter
- **Validation**: Jakarta Validation annotations present

#### JobDto (`DbConnections.DTO.JobDto`)
Maps Adzuna API JSON responses to Java objects:

**Key Features**:
- `@JsonIgnoreProperties(ignoreUnknown = true)` - Ignores unknown API fields
- Maps Adzuna's `"id"` field to `externalId` (NOT the database ID)
- Contains nested classes for API structure:
  - `CompanyInfo` - maps `company.display_name`
  - `LocationInfo` - maps `location.display_name`, `latitude`, `longitude`
  - `CategoryInfo` - maps `category.tag`, `category.label`

**Helper Methods**:
- `getCompanyName()` - extracts company name from nested object
- `getLocationName()` - extracts location display name
- `getCategoryTag()` - extracts category tag

**Field Mappings** (Adzuna API → JobDto):
```
"id"           → externalId
"title"        → title
"company"      → CompanyInfo (nested)
"location"     → LocationInfo (nested)
"category"     → CategoryInfo (nested)
"salary_min"   → salaryMin
"salary_max"   → salaryMax
"description"  → description
"redirect_url" → jobUrl
"created"      → createdDate
```

### 5. Database Layer

#### Database Schema Overview

The application uses a **normalized PostgreSQL schema** with foreign key relationships:

```sql
companies (id, name, created_at)
locations (id, city, state, country, display_name)
categories (id, name, tag)
jobs (id, external_id, company_id, location_id, category_id, ...)
applications (id, job_id, status, date_applied, ...)
status_history (id, application_id, old_status, new_status, ...)
```

**Key Features**:
- Foreign keys ensure referential integrity
- Unique constraints prevent duplicate companies/locations/categories
- Triggers automatically create applications for new jobs
- Triggers track application status changes
- View `vw_jobs_full` joins all tables for easy querying

#### JPA Entities

##### JobEntity (`DbConnections.DTO.Entities.JobEntity`)
Maps to `jobs` table:

**Fields**:
- `id` (Long) - Auto-generated primary key
- `externalId` (String) - Adzuna job ID (unique)
- `title` (String)
- `companyId` (Long) - Foreign key → companies.id
- `locationId` (Long) - Foreign key → locations.id
- `categoryId` (Long) - Foreign key → categories.id
- `salaryMin/salaryMax` (BigDecimal)
- `description` (Text)
- `jobUrl` (String)
- `source` (String) - API source (e.g., "Adzuna")
- `createdDate` (LocalDateTime) - Job posting date
- `dateFound` (LocalDateTime) - When we found it
- `applyBy` (LocalDate)

**Important**: The entity ID is NEVER set from the DTO. It's always auto-generated by the database to avoid optimistic locking conflicts.

##### Company (`DbConnections.DTO.Entities.Company`)
Maps to `companies` table:

**Fields**:
- `id` (Long) - Auto-generated primary key
- `name` (String) - Unique company name
- `createdAt` (LocalDateTime) - Auto-set on creation

##### Location (`DbConnections.DTO.Entities.Location`)
Maps to `locations` table:

**Fields**:
- `id` (Long) - Auto-generated primary key
- `city` (String) - Optional
- `state` (String) - Optional
- `country` (String) - Required (2-letter code)
- `displayName` (String) - Required, human-readable location
- `latitude` (Double) - Geographic latitude coordinate (auto-geocoded)
- `longitude` (Double) - Geographic longitude coordinate (auto-geocoded)

**Unique Constraint**: (city, state, country)
**Indexes**: latitude, longitude (for distance-based queries)

##### Category (`DbConnections.DTO.Entities.Category`)
Maps to `categories` table:

**Fields**:
- `id` (Long) - Auto-generated primary key
- `name` (String) - Unique, human-readable name
- `tag` (String) - Unique, machine-readable tag (e.g., "it-jobs")

#### Repositories

All repositories extend `JpaRepository<Entity, Long>`:

##### JobRepository (`DbConnections.Repositories.JobRepository`)
- `findByExternalId(String externalId)` - Look up job by Adzuna ID
- `findByQueryAndLocation(String query, String location)` - Search by query terms and location string (LIKE match)
- `findByQueryAndDistance(String query, double centerLat, double centerLon, int distanceMiles)` - **NEW!** Search by query and geographic distance using Haversine formula

##### CompanyRepository (`DbConnections.Repositories.CompanyRepository`)
- `findByName(String name)` - Look up company by name

##### LocationRepository (`DbConnections.Repositories.LocationRepository`)
- `findByDisplayName(String displayName)` - Look up location by display name

##### CategoryRepository (`DbConnections.Repositories.CategoryRepository`)
- `findByTag(String tag)` - Look up category by tag

#### JobMapper (`DbConnections.JobMapper`)

**Critical Component**: Converts JobDto → JobEntity with automatic foreign key resolution.

**Key Behavior**:
1. **Lookup or Create Pattern**: For each job, the mapper:
   - Checks if company exists → if not, creates it
   - Checks if location exists → if not, creates it and **automatically geocodes it**
   - Checks if category exists → if not, creates it
   - Returns the foreign key IDs

2. **Transaction Safety**:
   - Annotated with `@Transactional`
   - All lookups/creates are atomic
   - Prevents race conditions in concurrent requests

3. **ID Handling**:
   - **NEVER** sets `JobEntity.id` from DTO
   - Maps Adzuna `"id"` to `externalId` field
   - Database auto-generates the entity ID

4. **Geocoding Integration**: **NEW!**
   - Injects `GeocodingService` dependency
   - When creating new locations, automatically geocodes them via Nominatim API
   - Stores latitude/longitude coordinates in the database
   - Enables distance-based job filtering

**Methods**:
- `toEntity(JobDto)` - Main conversion, handles lookup/create
- `findOrCreateCompany(String)` - Private helper
- `findOrCreateLocation(String)` - Private helper with **automatic geocoding**
- `findOrCreateCategory(String)` - Private helper
- `toDto(JobEntity)` - Reverse conversion (limited, IDs only)

**Example Flow**:
```
Adzuna API returns:
{
  "id": "5354569383",
  "company": {"display_name": "Meta"},
  "location": {"display_name": "Five Points, Wake County"}
}

JobMapper process:
1. Parse to JobDto (id → externalId)
2. Look up "Meta" in companies table
   - Not found → Create company, get ID = 1
3. Look up "Five Points, Wake County" in locations
   - Not found → Create location, get ID = 1
4. Build JobEntity:
   - externalId = "5354569383"
   - companyId = 1
   - locationId = 1
   - id = NULL (database will generate)
5. Save to database
   - Database generates id = 42
```

### 6. Services

#### GeocodingService (`JobSearch.Services.GeocodingService`) - **NEW!**
Free geocoding service for converting location strings to lat/lon coordinates.

**Technology**: Uses Nominatim (OpenStreetMap) API - **free, no API key required**

**Key Features**:
- Converts location strings (e.g., "New York, NY") to geographic coordinates
- Results cached with `@Cacheable(value = "geocoding")` to avoid repeated API calls
- Returns `Coordinates` class with latitude, longitude, and display name
- Handles errors gracefully, returns null if geocoding fails

**Methods**:
- `geocode(String location)` - Main geocoding method, cached
- Inner class: `Coordinates` - Serializable container for lat/lon/displayName

**Usage Notes**:
- Adds User-Agent header (required by Nominatim usage policy)
- Automatically called by `JobMapper` when creating new locations
- Nominatim API has rate limits - caching prevents hitting limits

#### JobSearchService (`JobSearch.Services.JobSearchService`)
- Implements `JobSearchImpl` interface
- Annotated with `@Transactional` for database operations
- **Workflow**:
  1. Builds `SearchParamsDto` with defaults (resultsPerPage: 20, fullTime: 1)
  2. Calls `AdzunaClient.getResponseEntity()` to fetch jobs
  3. Parses JSON response to `List<JobDto>`
  4. For each job:
     - Checks if it already exists (by `externalId`)
     - If new: Sets `source="Adzuna"` and converts to entity (with auto-geocoding)
     - Skips if already in database
  5. Batch saves all new jobs via `jobRepository.saveAll()`
  6. Returns original API response to caller

**Key Features**:
- Automatic duplicate detection via `externalId`
- Transaction ensures atomicity
- `JobMapper` handles foreign key lookups/creates with **automatic geocoding**
- Logs count of saved jobs

**Database Query Methods**: **NEW!**
- `getJobsFromDatabase(query, location)` - Basic search
- `getJobsFromDatabase(query, location, dateFrom, dateTo)` - With date filtering
- `getJobsFromDatabase(query, location, excludedTerms, dateFrom, dateTo)` - With exclude terms
- `getJobsFromDatabase(query, location, distance, excludedTerms, dateFrom, dateTo)` - **Full-featured with distance**

**Smart Query Selection**: **NEW!**
1. Attempts to geocode the search location
2. If successful: Uses `findByQueryAndDistance()` with Haversine formula
3. If geocoding fails: Falls back to `findByQueryAndLocation()` string matching
4. Applies exclude terms filtering (comma-separated list)
5. Applies date range filtering (dateFrom/dateTo)
6. Results cached in Redis for 1 hour

### 7. Dashboard Backend (Stub)

#### JobDashBoredService (`DashBoardBackend.Services.JobDashBoredService`)
Planned methods (all empty):
- `getJobs()`: Aggregate jobs from all sources → database
- `getAppliedJobs()`: Retrieve user's applied jobs
- `getSavedJobs()`: Retrieve user's saved jobs
- `getAllJobs()`: Retrieve all available jobs

**Note**: Contains typo "Bored" instead of "Board"

---

## Configuration & Environment

### Configuration Files

#### application.properties (PRIMARY)
```properties
spring.application.name=JobSearchApplication

# Adzuna API
adzuna.base-url=https://api.adzuna.com/v1/api/jobs/us/search/1
adzuna.api-id=0b846404
adzuna.api-key=eb58ac8b07e0b9e1d7f9c77ea0bfe9ee

# Database (PostgreSQL - FULLY CONFIGURED)
spring.datasource.url=jdbc:postgresql://localhost:5433/JobHunterDb2
spring.datasource.username=admin
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver

# HikariCP Connection Pool Settings
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.connection-test-query=SELECT 1
spring.datasource.hikari.validation-timeout=5000
spring.datasource.hikari.leak-detection-threshold=60000

# JPA/Hibernate Settings
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.open-in-view=false
```

**IMPORTANT NOTES**:
- ⚠️ API credentials are HARDCODED (should be in environment variables)
- ⚠️ Database password is EXPOSED (should be in environment variables)
- ✅ Database is fully configured with PostgreSQL on port 5433
- ✅ HikariCP connection pooling enabled for stability
- ✅ Schema managed by init/schema.sql (ddl-auto=none) - Hibernate doesn't touch the schema
- ✅ Open-in-view disabled to prevent connection leaks

#### application.yml (SECONDARY)
- Contains Adzuna configuration with GB market URL
- May conflict with application.properties
- Uses different property names (`app-id` vs `api-id`)

### Security Considerations

**CRITICAL**: Sensitive data is committed to version control:
1. Adzuna API credentials
2. Database passwords
3. Should be migrated to environment variables or secret management

---

## Development Conventions

### Code Style

1. **Package Naming**:
   - Uses PascalCase for some packages (`JobSearch`, `DashBoardBackend`)
   - Standard Java convention is lowercase
   - Be consistent when adding new packages

2. **Interface Naming**:
   - **Non-standard**: `JobSearchImpl` is the INTERFACE, `JobSearchService` is the implementation
   - Standard Java: interfaces don't have "Impl" suffix
   - When extending, follow existing pattern

3. **Documentation**:
   - Javadoc comments present on classes and methods
   - Continue adding documentation for new code

4. **Lombok Usage**:
   - DTOs use `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`
   - Services use constructor injection (no `@Autowired`)

5. **Logging**:
   - SLF4J logger in base `Client` class
   - Use `logger.info()` for API calls
   - Use `logger.error()` for exceptions

### Common Patterns

1. **Adding a New Job API Client**:
   ```java
   // 1. Extend Client abstract class
   public class NewApiClient extends Client {
       // 2. Implement abstract methods
       @Override
       public URI buildUri(SearchParamsDto params) { ... }

       @Override
       public ResponseEntity<String> getResponseEntity(SearchParamsDto params) { ... }
   }

   // 3. Add bean to ClientConfig
   @Bean
   public NewApiClient newApiClient(RestTemplate restTemplate,
                                     @Value("${newapi.url}") String url) {
       return new NewApiClient(restTemplate, url);
   }
   ```

2. **Adding New Search Parameters**:
   - Add field to `SearchParamsDto` with validation annotations
   - Update `AdzunaClient.buildUri()` to include parameter
   - Update `JobSearchService.searchJobs()` to set defaults

3. **Error Handling**:
   - Clients catch `HttpClientErrorException`
   - Log errors and re-throw
   - Consider adding custom exception classes

### Optimistic Locking Fix (Database-Setup Branch)

**Problem Solved**: The application was experiencing `org.springframework.orm.ObjectOptimisticLockingFailureException` when saving jobs from the Adzuna API.

**Root Cause**:
The Adzuna API returns jobs with an `"id"` field (e.g., `"5354569383"`). Initially, the code was mapping this API ID directly to the `JobEntity.id` field. This caused Hibernate to think these were existing entities that needed to be UPDATED, not new entities to be INSERTED. When Hibernate tried to UPDATE a non-existent row, it threw the optimistic locking exception.

**The Fix** (7 commits):

1. **Fixed Adzuna API Mapping** (commit eb9f536):
   - Created proper `JobDto` with nested classes (`CompanyInfo`, `LocationInfo`, `CategoryInfo`)
   - Mapped Adzuna `"id"` to `externalId` field (NOT `JobEntity.id`)
   - Added `@JsonProperty` annotations to match Adzuna's JSON structure
   - Added `@JsonIgnoreProperties(ignoreUnknown = true)` to handle API changes

2. **Implemented Foreign Key Relationships** (commit 2a7eae0):
   - Created `Company`, `Location`, `Category` entities
   - Created repositories with lookup methods (`findByName`, `findByTag`, etc.)
   - Updated `JobEntity` to use foreign keys (`companyId`, `locationId`, `categoryId`)
   - Implemented `JobMapper` with lookup-or-create pattern
   - Added `@Transactional` for atomicity

3. **Added HikariCP Connection Pool & Fixed Hibernate Mode** (commit fff42eb):
   - Added HikariCP connection pool settings for database stability
   - Changed `hibernate.ddl-auto` from "update" to "validate"
   - Schema is created by `init/schema.sql`, not auto-generated
   - Added `connection-test-query=SELECT 1` to prevent connection closed errors
   - Added PostgreSQL dialect and metadata settings

4. **Changed Hibernate DDL Mode to Validate** (commit b5d6143):
   - Set `spring.jpa.hibernate.ddl-auto=validate` (was "update")
   - Schema is managed by `init/schema.sql` in Docker initialization
   - Hibernate validates schema matches entities, doesn't modify it

5. **Fixed Schema Type Mismatch (SERIAL → BIGSERIAL)** (commit e8dc71f):
   - Changed all primary keys from `SERIAL` (int4) to `BIGSERIAL` (bigint)
   - Changed all foreign keys from `INTEGER` to `BIGINT`
   - Matches JPA `Long` type expectations
   - Resolves "found [int4], but expecting [bigint]" validation error

6. **Fixed external_id Column Length Mismatch** (commit 14f84c8):
   - Changed `external_id` from `VARCHAR(100)` to `VARCHAR(255)` in schema.sql
   - Matches JPA default String mapping (255 characters)
   - Prevents Hibernate from attempting ALTER COLUMN during validation
   - Resolves "cannot alter type of a column used by a view or rule" error
   - Views like `vw_jobs_full` depend on column types remaining stable

7. **Changed DDL Mode from Validate to None** (commit f8d2713):
   - Changed `spring.jpa.hibernate.ddl-auto` from "validate" to "none"
   - Prevents Hibernate from inspecting schema metadata during startup
   - Resolves persistent "This connection has been closed" errors during validation
   - Schema is fully managed by init/schema.sql, no need for Hibernate validation
   - Added `spring.jpa.open-in-view=false` to prevent connection leaks

**Key Design Decisions**:
   - **Never set `JobEntity.id` from DTO** - Always let database auto-generate
   - **Use `externalId` for API IDs** - Track Adzuna's ID separately
   - **Normalize the schema** - Separate tables for companies/locations/categories
   - **Automatic deduplication** - Check `externalId` before saving
   - **Use BIGSERIAL for all IDs** - Matches JPA Long type (64-bit)
   - **Schema validation mode** - Database schema managed by SQL, not Hibernate
   - **Match VARCHAR lengths** - All String columns must match JPA defaults or use @Column(length=X)
   - **Views constrain schema** - Columns used by views cannot be altered, must be correct from start

**Code Flow** (After Fix):
```java
Adzuna API Response:
{
  "id": "5354569383",           // Adzuna's job ID
  "company": {"display_name": "Meta"},
  "location": {"display_name": "Five Points, Wake County"}
}

JobSearchService.searchJobs():
1. Parse JSON → JobDto (id → externalId)
2. Check if externalId exists in database → Skip if found
3. Set dto.source = "Adzuna"
4. Call jobMapper.toEntity(dto)

JobMapper.toEntity():
1. Look up "Meta" in companies → Not found → Create → Get ID=1
2. Look up "Five Points" in locations → Not found → Create → Get ID=2
3. Build JobEntity:
   - id = NULL (not set!)
   - externalId = "5354569383"
   - companyId = 1
   - locationId = 2
4. Return entity

JobSearchService (continued):
5. Save entity → Database generates id = 42
6. Result: New job saved with auto-generated ID
```

**Why This Works**:
- Hibernate sees `id=NULL` → Treats as new entity → INSERT operation
- No version conflict because it's an INSERT, not an UPDATE
- Foreign keys are properly resolved before saving
- Transactions ensure atomicity of lookup/create operations
- Duplicate jobs are prevented via `externalId` uniqueness

---

## Building & Running

### Maven Commands

```bash
# Clean and compile
./mvnw clean compile

# Run application
./mvnw spring-boot:run

# Package as JAR
./mvnw package

# Run tests (when implemented)
./mvnw test

# Skip tests during build
./mvnw package -DskipTests
```

### Application Startup

Main class: `main.JobSearchApplication`

**Startup Notes**:
- Application runs on default port 8080
- ✅ Database is FULLY CONFIGURED (PostgreSQL)
- Scans `JobSearch`, `DbConnections`, and `DashBoardBackend` packages
- Requires PostgreSQL running on localhost:5433 (Docker)
- Database schema created via `init/schema.sql` (Docker initialization)
- Hibernate ignores schema (ddl-auto=none), does not validate or modify it
- Configuration is consistent between local and Docker environments

### Testing the API

```bash
# Basic search
curl "http://localhost:8080/api/jobs/search?query=software+engineer&location=New+York"

# Search with distance parameter (default: 25 miles)
curl "http://localhost:8080/api/jobs/search?query=java+developer&location=New+York&distance=50"

# Search with exclude terms (comma-separated)
curl "http://localhost:8080/api/jobs/search?query=developer&location=Remote&excludedTerms=senior,lead"

# Search with date range
curl "http://localhost:8080/api/jobs/search?query=engineer&location=Seattle&dateFrom=2025-01-01&dateTo=2025-01-31"

# Full-featured search
curl "http://localhost:8080/api/jobs/search?query=developer&location=Boston&distance=30&excludedTerms=senior&dateFrom=2025-01-01"
```

### Docker Database Setup

The application uses PostgreSQL running in Docker:

```bash
# Start database (recreates schema from init/schema.sql)
docker-compose up -d

# Stop database
docker-compose down

# Stop and remove volumes (clean slate - required after schema.sql changes)
docker-compose down -v

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

**Database Details**:
- **Container**: PostgreSQL 15+
- **Port**: 5433 (mapped to container's 5432)
- **Database**: JobHunterDb2
- **User**: admin
- **Password**: password
- **Init Script**: `init/schema.sql` runs automatically on first start
- **Restart Policy**: `on-failure:3` (max 3 restart attempts, prevents infinite loops)

**Important**: After modifying `init/schema.sql`, you MUST run `docker-compose down -v` to remove the old database volume, then `docker-compose up -d` to recreate with new schema.

---

## Git Workflow

### Branch Strategy

- **Current Branch**: `claude/fix-optimistic-locking-exception-01648B6FHTg3VfcTRRHARrFs`
- All AI assistant work should be on `claude/*` branches
- Merge to main via Pull Requests
- Recent work: Database setup and optimistic locking fix

### Recent Commits Pattern

```
a3a7042 Merge pull request #1 from Mandersen1208/JobSearchImplemention
ef15c25 refactor package structure and add database configuration...
f51d09f update AdzunaClient and SearchParamsDto for improved...
```

**Commit Message Convention**:
- Lowercase imperative mood ("add", "update", "refactor", "fix")
- Focus on what was changed, not why
- Keep under 72 characters

### Git Operations

```bash
# Push to current branch
git push -u origin claude/fix-optimistic-locking-exception-01648B6FHTg3VfcTRRHARrFs

# Check status
git status

# View recent changes
git log --oneline -10
```

---

## TODOs & Known Issues

### ✅ Database Setup - COMPLETE

**Status**: Fully operational and tested in both local and Docker environments

The database integration is complete with all issues resolved:

**Core Implementation**:
- Normalized PostgreSQL schema with foreign key relationships
- JPA entities (JobEntity, Company, Location, Category)
- Repository layer with lookup methods
- JobMapper with transactional lookup-or-create pattern
- Automatic job persistence from Adzuna API

**Configuration**:
- HikariCP connection pooling (max 10, min idle 5)
- Schema managed by `init/schema.sql` (ddl-auto=none)
- Consistent configuration between local and Docker
- Docker restart policy limited to 3 attempts

**Issues Resolved**:
- ObjectOptimisticLockingFailureException (7-commit fix)
- Schema type mismatches (SERIAL → BIGSERIAL, VARCHAR lengths)
- Connection closure errors during startup
- Infinite Docker restart loops

### ✅ Geographic Distance-Based Filtering - COMPLETE **NEW!**

**Status**: Fully operational with automatic geocoding and Haversine distance calculations

**Problem Solved**: String-based location matching was too restrictive. Searching "New York" only returned jobs with "New York" in the location name, missing jobs in Brooklyn, Queens, Jersey City, etc. that were within the search radius.

**Solution**: Geographic distance-based filtering using lat/lon coordinates and Haversine formula.

**Implementation Details**:

1. **Database Schema** ([init/schema.sql:49-50](init/schema.sql#L49-L50)):
   - Added `latitude DOUBLE PRECISION` column to locations table
   - Added `longitude DOUBLE PRECISION` column to locations table
   - Added indexes on both columns for query performance

2. **Location Entity** ([Location.java:38-42](backend/src/main/java/DbConnections/DTO/Entities/Location.java#L38-L42)):
   - Added `latitude` and `longitude` fields (Double)

3. **GeocodingService** ([GeocodingService.java](backend/src/main/java/JobSearch/Services/GeocodingService.java)):
   - Uses Nominatim (OpenStreetMap) API for free geocoding
   - Converts location strings to lat/lon coordinates
   - Results cached with `@Cacheable("geocoding")` to avoid repeated API calls
   - Returns `Coordinates` class (Serializable for Redis)

4. **JobRepository** ([JobRepository.java:43-55](backend/src/main/java/DbConnections/Repositories/JobRepository.java#L43-L55)):
   - Added `findByQueryAndDistance()` method
   - Uses Haversine formula in native SQL to calculate distance in miles:
     ```sql
     3959 * acos(cos(radians(centerLat)) * cos(radians(l.latitude)) *
                 cos(radians(l.longitude) - radians(centerLon)) +
                 sin(radians(centerLat)) * sin(radians(l.latitude)))
     ```

5. **JobMapper** ([JobMapper.java:88-103](backend/src/main/java/DbConnections/JobMapper.java#L88-L103)):
   - Injected `GeocodingService` dependency
   - Updated `findOrCreateLocation()` to geocode new locations
   - Stores latitude/longitude when creating location records

6. **JobSearchService** ([JobSearchService.java:192-218](backend/src/main/java/JobSearch/Services/JobSearchService.java#L192-L218)):
   - Added new method: `getJobsFromDatabase(query, location, distance, excludedTerms, dateFrom, dateTo)`
   - Smart query selection:
     - Tries geocoding first for accurate geographic filtering
     - If successful: uses `findByQueryAndDistance()` with Haversine formula
     - If geocoding fails: falls back to string matching
   - Extensive logging for debugging

7. **JobSearchController** ([JobSearchController.java:59-71](backend/src/main/java/JobSearch/Controllers/JobSearchController.java#L59-L71)):
   - Updated to pass `distance` parameter to service (default: 25 miles)

**How It Works**:

**Before:**
- Search "New York" → Database: `LIKE '%new york%'`
- Returns only 3 jobs with "New York" in location name
- Misses Brooklyn, Queens, Jersey City, etc.

**After:**
1. User searches "New York" with distance=25 miles
2. `GeocodingService.geocode("New York")` → (40.7128, -74.0060)
3. Database calculates distance from center point using Haversine formula
4. Returns all jobs within 25-mile radius: Manhattan, Brooklyn, Queens, Jersey City, etc.
5. If geocoding fails, gracefully falls back to string matching

**Benefits**:
- ✅ More accurate results - Geographic distance instead of string matching
- ✅ Flexible radius - Users can adjust distance parameter
- ✅ Graceful fallback - Falls back to string matching if geocoding fails
- ✅ Performance optimized - Geocoding results cached, distance calculated in SQL
- ✅ Backwards compatible - Existing API calls still work
- ✅ Automatic geocoding - New locations are geocoded when jobs are saved

### ✅ Advanced Job Filtering - COMPLETE **NEW!**

**Status**: Fully operational with exclude terms and date range filtering

**Implementation**:

1. **Exclude Terms Filtering** ([JobSearchService.java:220-215](backend/src/main/java/JobSearch/Services/JobSearchService.java#L220-L215)):
   - Comma-separated list of terms to exclude from results
   - Filters out jobs with excluded terms in title or description
   - Example: `excludedTerms=senior,lead,manager` removes senior-level positions

2. **Date Range Filtering** ([JobSearchService.java:217-235](backend/src/main/java/JobSearch/Services/JobSearchService.java#L217-L235)):
   - Filter jobs by creation date
   - Parameters: `dateFrom` and `dateTo` (ISO date format: YYYY-MM-DD)
   - Example: `dateFrom=2025-01-01&dateTo=2025-01-31` returns jobs from January 2025

3. **Combined Filtering**:
   - All filters can be combined in a single request
   - Example: Search "developer" within 30 miles of "Boston", exclude "senior,lead", posted in January 2025
   - Filters applied in sequence: distance → exclude terms → date range

**API Parameters**:
- `query` (required): Job title or keywords
- `location` (required): Job location (geocoded automatically)
- `distance` (optional, default=25): Search radius in miles
- `excludedTerms` (optional): Comma-separated terms to exclude
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)

### Next Steps

1. **Security** (High Priority)
   - Move API credentials to environment variables
   - Remove sensitive data from `application.properties`
   - Add `.env` to `.gitignore`

2. **Dashboard Backend**
   - Implement `JobDashBoredService` methods (fix typo: Bored → Board)
   - Add REST endpoints for dashboard
   - Implement job application workflow
   - Applications table ready (created by schema.sql triggers)

3. **Testing**
   - Write unit tests for `AdzunaClient`
   - Add integration tests for API endpoints
   - Mock external API calls
   - Test Docker environment

4. **Multi-API Support**
   - Add more job search API clients (Indeed, LinkedIn, etc.)
   - Implement result aggregation logic
   - Add client selection/rotation

5. **Code Quality Improvements**
   - Fix naming typos: `JobDashBoredService` → `JobDashboardService`
   - Fix naming typos: `JoabBoardImpl` → `JobBoardImpl`
   - Standardize field naming: `SearchParamsDto.Location` → lowercase `location`
   - Consider moving `JobSearchApplication` from `main` package to standard location
   - Consider renaming interface `JobSearchImpl` → `JobSearchService`

6. **Documentation**
   - Add README.md with setup instructions
   - Document API endpoints with OpenAPI/Swagger
   - Add architecture diagrams

---

## AI Assistant Guidelines

### When Making Changes

1. **Always check active application**:
   - Main entry point is `JobSearchApplication.java` (in `main` package)
   - Only `JobSearch` package is component-scanned

2. **Follow existing patterns**:
   - Use PascalCase for package names (matches existing style)
   - Put interfaces in `Services/Implementations/`
   - Service classes implement interfaces

3. **Configuration changes**:
   - Update both `application.properties` AND `application.yml` if both exist
   - Or recommend consolidating to one format

4. **Adding dependencies**:
   - Update `pom.xml`
   - Ensure Lombok annotation processors are configured
   - Check compatibility with Spring Boot 3.5.7

5. **Database changes**:
   - ✅ Database is FULLY CONFIGURED and operational
   - Schema is managed by `init/schema.sql` (not Hibernate auto-generation)
   - Use BIGSERIAL for all ID columns to match JPA Long type
   - All changes must be made to schema.sql and require database recreation

### Code Review Checklist

- [ ] Follows existing package structure
- [ ] Includes Javadoc comments
- [ ] Uses Lombok where appropriate
- [ ] Constructor injection (not field injection)
- [ ] Adds logging for important operations
- [ ] Handles exceptions appropriately
- [ ] No sensitive data in code
- [ ] Consistent with naming conventions (even if non-standard)

### Testing Approach

- Unit tests go in `src/test/Test/com/example/jobhunter1/`
- Use standard testing hierarchy matching source packages
- Mock external API calls (don't hit real APIs in tests)
- Use `@SpringBootTest` for integration tests

### Common Pitfalls

1. **Component Scanning**: Adding code outside `JobSearch` package won't be picked up
2. **Configuration Priority**: Spring loads properties in specific order, may override unexpectedly
3. **Database Driver**: MySQL URL + PostgreSQL driver = startup failure
4. **API Credentials**: Don't commit new credentials to version control

---

## Useful File Locations

### Frequently Modified
- REST Controllers: `src/main/java/JobSearch/Controllers/`
- Services: `src/main/java/JobSearch/Services/`
- API Clients: `src/main/java/JobSearch/Clients/`
- DTOs: `src/main/java/DbConnections/DTO/`
- Config: `src/main/resources/application.properties`

### Configuration
- Maven: `pom.xml`
- Spring Boot: `src/main/resources/application.properties`
- Client Beans: `src/main/java/JobSearch/Clients/ClientConfig.java`

### Entry Points
- Main: `src/main/JobSearchApplication.java`
- Alternative: `src/main/java/com/example/jobhunter1/JobHunter1Application.java`

---

## Quick Reference

### API Endpoints
| Method | Path | Parameters | Description |
|--------|------|------------|-------------|
| GET | /api/jobs/search | query, location | Search jobs via Adzuna |

### Configuration Properties
| Property | Location | Purpose |
|----------|----------|---------|
| adzuna.base-url | application.properties:5 | Adzuna API endpoint |
| adzuna.api-id | application.properties:6 | Adzuna app ID |
| adzuna.api-key | application.properties:7 | Adzuna API key |
| spring.datasource.url | application.properties:9 | Database URL (disabled) |

### Key Classes
| Class | Location | Purpose |
|-------|----------|---------|
| JobSearchApplication | src/main/JobSearchApplication.java:11 | Application entry point |
| JobSearchController | src/main/java/JobSearch/Controllers/JobSearchController.java:11 | REST API handler |
| AdzunaClient | src/main/java/JobSearch/Clients/AdzunaClient.java:14 | Adzuna API client |
| SearchParamsDto | src/main/java/DbConnections/DTO/SearchParamsDto.java:15 | Job search parameters |

---

## Questions & Clarifications Needed

When working on this codebase, consider asking the developer:

1. **Configuration**: Should we standardize on `.properties` or `.yml`?
2. **Package Structure**: Move to standard lowercase package names?
3. **Interface Naming**: Rename `JobSearchImpl` interface to match Java conventions?
4. **API Credentials**: Set up environment variable injection?
5. **Dashboard**: What's the priority for implementing dashboard features?
6. **Multiple APIs**: Which job search APIs should be added next?

---

## Additional Resources

- Spring Boot 3.5.7 Documentation: https://docs.spring.io/spring-boot/docs/3.5.7/reference/html/
- Adzuna API Documentation: https://developer.adzuna.com/
- Nominatim (OpenStreetMap) API Documentation: https://nominatim.org/release-docs/latest/api/Overview/
- Java 17 Documentation: https://docs.oracle.com/en/java/javase/17/
- Lombok Documentation: https://projectlombok.org/
- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula

---

**Last Updated**: 2026-01-09
**Codebase Version**: Geographic distance-based filtering implemented with automatic geocoding
**Branch**: `eamil-feature` (previously `claude/fix-optimistic-locking-exception-01648B6FHTg3VfcTRRHARrFs`)
**AI Assistant**: Claude (Anthropic)

**Database Status**: ✅ Fully operational in both local and Docker environments
**New Features**: ✅ Geographic distance filtering, exclude terms filtering, date range filtering

## Database Schema Management

This project uses `hibernate.ddl-auto=none` because the schema is fully managed by `init/schema.sql`. Hibernate does not create, validate, or modify the database schema.

### Why ddl-auto=none?

After extensive troubleshooting, we switched from `validate` to `none` because:
1. Schema validation caused persistent "This connection has been closed" errors
2. Hibernate would spend too much time inspecting indexes/constraints, causing connections to timeout
3. Our schema is managed externally via `init/schema.sql`, so validation is redundant

### Schema Type Reference

If you ever need to add new entities, ensure your schema.sql types match JPA expectations:

| JPA Type | Schema Type | Notes |
|----------|-------------|-------|
| Long | BIGSERIAL | NOT SERIAL (int4) |
| String (no @Column) | VARCHAR(255) | Default JPA length |
| String @Column(length=100) | VARCHAR(100) | Explicit length |
| BigDecimal | NUMERIC | Precision/scale optional |
| LocalDateTime | TIMESTAMP | NOT TIMESTAMP WITH TIME ZONE |

**View Dependencies**: Columns used in views (like `vw_jobs_full`) cannot be altered. Schema must be correct from initial creation or views must be dropped/recreated.

**Best Practice**: Always test schema changes by recreating the database (`docker-compose down -v && docker-compose up -d`) to ensure init/schema.sql creates the correct structure.

---

## Quick Start Summary

### ✅ Database is Ready!

The database integration is **complete and operational**. You can:

1. **Run Locally**:
   ```bash
   # Ensure Docker database is running
   docker-compose up -d

   # Start Spring Boot application
   ./mvnw spring-boot:run
   ```

2. **Test the API**:
   ```bash
   curl "http://localhost:8080/api/jobs/search?query=java+developer&location=Remote"
   ```

3. **Run in Docker**:
   ```bash
   docker-compose up -d --build
   docker-compose logs -f app
   ```

### Key Points for Next Session

- **Database**: Fully configured with PostgreSQL (port 5433)
- **Schema**: Managed by `init/schema.sql` (hibernate ddl-auto=none)
- **Connection**: HikariCP pooling enabled
- **Restart Policy**: Limited to 3 attempts (prevents loops)
- **Next Focus**: Security (move credentials to env vars) or Dashboard implementation
