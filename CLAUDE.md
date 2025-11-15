# CLAUDE.md - AI Assistant Guide for ProjectDashbored

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
- ✅ Database is ENABLED with PostgreSQL backend
- ✅ Normalized database schema with foreign key relationships
- ✅ Automatic data persistence from Adzuna API to database
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

**Unique Constraint**: (city, state, country)

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
   - Checks if location exists → if not, creates it
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

**Methods**:
- `toEntity(JobDto)` - Main conversion, handles lookup/create
- `findOrCreateCompany(String)` - Private helper
- `findOrCreateLocation(String)` - Private helper
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

#### JobSearchService (`JobSearch.Services.JobSearchService`)
- Implements `JobSearchImpl` interface
- Annotated with `@Transactional` for database operations
- **Workflow**:
  1. Builds `SearchParamsDto` with defaults (resultsPerPage: 20, fullTime: 1)
  2. Calls `AdzunaClient.getResponseEntity()` to fetch jobs
  3. Parses JSON response to `List<JobDto>`
  4. For each job:
     - Checks if it already exists (by `externalId`)
     - If new: Sets `source="Adzuna"` and converts to entity
     - Skips if already in database
  5. Batch saves all new jobs via `jobRepository.saveAll()`
  6. Returns original API response to caller

**Key Features**:
- Automatic duplicate detection via `externalId`
- Transaction ensures atomicity
- `JobMapper` handles foreign key lookups/creates
- Logs count of saved jobs

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

# Database (PostgreSQL - ENABLED)
spring.datasource.url=jdbc:postgresql://localhost:5432/JobHunterDb2
spring.datasource.username=admin
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

**IMPORTANT NOTES**:
- ⚠️ API credentials are HARDCODED (should be in environment variables)
- ⚠️ Database password is EXPOSED (should be in environment variables)
- ✅ Database is configured correctly with PostgreSQL

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

**The Fix** (3 commits):

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

3. **Key Design Decisions**:
   - **Never set `JobEntity.id` from DTO** - Always let database auto-generate
   - **Use `externalId` for API IDs** - Track Adzuna's ID separately
   - **Normalize the schema** - Separate tables for companies/locations/categories
   - **Automatic deduplication** - Check `externalId` before saving

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
- ✅ Database connection is ENABLED (PostgreSQL)
- Scans `JobSearch`, `DbConnections`, and `DashBoardBackend` packages
- Requires PostgreSQL running on localhost:5432
- Database schema auto-created via `init/schema.sql` (Docker) or `hibernate.ddl-auto=update`

### Testing the API

```bash
# Search for jobs
curl "http://localhost:8080/api/jobs/search?query=software+engineer&location=New+York"
```

---

## Git Workflow

### Branch Strategy

- **Current Branch**: `claude/claude-md-mhy06o15r3vx4pkh-013AhgBS43L8eWKYuocMgAA6`
- All AI assistant work should be on `claude/*` branches
- Merge to main via Pull Requests

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
git push -u origin claude/claude-md-mhy06o15r3vx4pkh-013AhgBS43L8eWKYuocMgAA6

# Check status
git status

# View recent changes
git log --oneline -10
```

---

## TODOs & Known Issues

### ✅ Recently Completed

1. **Database Integration** ✅ COMPLETE
   - ✅ Removed `DataSourceAutoConfiguration` exclusion
   - ✅ Resolved MySQL vs PostgreSQL driver inconsistency
   - ✅ Implemented normalized database schema with foreign keys
   - ✅ Created JPA entities (JobEntity, Company, Location, Category)
   - ✅ Created repositories with lookup methods
   - ✅ Implemented JobMapper with automatic foreign key resolution
   - ✅ Enabled `@Transactional` and `@EnableRetry`
   - ✅ Jobs are now automatically persisted from Adzuna API

2. **Optimistic Locking Fix** ✅ COMPLETE
   - ✅ Fixed `ObjectOptimisticLockingFailureException`
   - ✅ JobMapper never sets entity ID from API response
   - ✅ Database auto-generates all primary keys
   - ✅ Proper mapping of Adzuna "id" to `externalId` field
   - ✅ Transaction safety with `@Transactional`

### Critical TODOs

1. **Security**
   - Move API credentials to environment variables
   - Remove sensitive data from `application.properties`
   - Add `.env` to `.gitignore`

3. **Configuration Conflicts**
   - Decide between `application.properties` and `application.yml`
   - Standardize Adzuna config property names
   - Document which configuration takes precedence

### Implementation TODOs

2. **Dashboard Backend**
   - Implement `JobDashBoredService` methods
   - Applications table exists (created by schema.sql triggers)
   - Add REST endpoints for dashboard
   - Implement job application workflow

3. **Testing**
   - Write tests for `AdzunaClient`
   - Add integration tests for API endpoints
   - Mock external API calls

4. **Multi-API Support**
   - Add more job search API clients (Indeed, LinkedIn, etc.)
   - Implement result aggregation logic
   - Add client selection/rotation

### Code Quality Issues

5. **Naming Inconsistencies**
   - `JobDashBoredService` → `JobDashboardService` (typo)
   - `JoabBoardImpl` → `JobBoardImpl` (typo)
   - `SearchParamsDto.Location` → lowercase `location`

6. **Architecture**
   - `JobSearchApplication` in `main` package → move to standard package
   - Interface naming: `JobSearchImpl` should be `JobSearchService` (interface)
   - Consider renaming implementation to `JobSearchServiceImpl`

7. **Documentation**
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
   - Remember database is currently DISABLED
   - Will need to enable in `JobSearchApplication`
   - Fix driver inconsistency before enabling

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
2. **Database**: Which database will be used - MySQL or PostgreSQL?
3. **Package Structure**: Move to standard lowercase package names?
4. **Interface Naming**: Rename `JobSearchImpl` interface to match Java conventions?
5. **API Credentials**: Set up environment variable injection?
6. **Dashboard**: What's the priority for implementing dashboard features?
7. **Multiple APIs**: Which job search APIs should be added next?

---

## Additional Resources

- Spring Boot 3.5.7 Documentation: https://docs.spring.io/spring-boot/docs/3.5.7/reference/html/
- Adzuna API Documentation: https://developer.adzuna.com/
- Java 17 Documentation: https://docs.oracle.com/en/java/javase/17/
- Lombok Documentation: https://projectlombok.org/

---

**Last Updated**: 2025-11-13
**Codebase Version**: Commit `a3a7042`
**AI Assistant**: Claude (Anthropic)
