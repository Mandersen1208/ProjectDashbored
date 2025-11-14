# CLAUDE.md - AI Assistant Guide for ProjectDashbored

## Project Overview

**ProjectDashbored** (formerly JobHunter1) is a Spring Boot application designed to aggregate job postings from multiple job search APIs and provide a unified dashboard for job seekers. The application currently integrates with the Adzuna API and is architected to support additional job search providers in the future.

### Tech Stack
- **Framework**: Spring Boot 3.5.7
- **Java Version**: 23 (Eclipse Temurin)
- **Build Tool**: Maven
- **Database**: PostgreSQL 16
- **Containerization**: Docker & Docker Compose
- **Key Dependencies**:
  - Spring Boot Starter Web (REST API)
  - Spring Boot Starter Data JPA (ORM)
  - Spring Boot Starter JDBC (Database connectivity)
  - Spring Boot Starter Validation (DTO validation)
  - Spring Boot Starter Actuator (Monitoring)
  - Lombok (Boilerplate reduction)
  - PostgreSQL Driver 42.7.7

### Current Status
- ✅ Job search functionality implemented with Adzuna API integration
- ✅ Database configuration enabled and working with Docker PostgreSQL
- ✅ Docker Compose setup for both database and application
- ✅ Database schema with jobs, applications, companies, locations, categories
- ✅ Automatic application tracking via database triggers
- 🚧 Dashboard backend services are stubbed but not fully implemented
- 🚧 Test structure exists but tests are not yet written

---

## Docker Setup

The application runs completely in Docker with both the database and Spring Boot app containerized.

### Quick Start

```bash
# Start everything (database + application)
docker-compose up

# Start in background
docker-compose up -d

# Rebuild after code changes
docker-compose up --build

# Stop everything
docker-compose down

# Stop and remove volumes (fresh database)
docker-compose down -v

# View logs
docker-compose logs -f app
docker-compose logs -f db
```

### Docker Services

#### Database Service (`db`)
- **Container**: `jobhunter-postgres`
- **Image**: `postgres:16-alpine`
- **Port**: `5433:5432` (host:container)
- **Database**: `JobHunterDb2`
- **Username**: `admin`
- **Password**: `password`
- **Health Check**: Runs `pg_isready` every 10 seconds
- **Volume**: Persists data in `pgdata` volume
- **Init**: Automatically runs `init/schema.sql` on first startup

#### Application Service (`app`)
- **Container**: `jobhunter-app`
- **Build**: Multi-stage Dockerfile with Maven build
- **Port**: `8080:8080`
- **Java**: Eclipse Temurin 23 JRE Alpine
- **Depends On**: Database service (waits for healthy status)
- **Auto-restart**: Enabled (`restart: unless-stopped`)

### Dockerfile

Multi-stage build:
1. **Build Stage**: Uses Maven with JDK 23 to compile and package
2. **Runtime Stage**: Uses JRE 23 Alpine for minimal image size
3. **JAR Verification**: Prints Main-Class from manifest during build

---

## Architecture & Directory Structure

### Package Organization

```
ProjectDashbored/
├── .dockerignore                   # Docker build exclusions
├── Dockerfile                      # Multi-stage build definition
├── docker-compose.yml              # Service orchestration
├── pom.xml                         # Maven configuration
├── init/
│   └── schema.sql                  # Database initialization script
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   ├── main/                              # Main application package
│   │   │   │   └── JobSearchApplication.java      # Spring Boot application entry
│   │   │   ├── JobSearch/                         # Job search module (ACTIVE)
│   │   │   │   ├── Clients/                       # External API clients
│   │   │   │   │   ├── Client.java                # Abstract base client
│   │   │   │   │   ├── AdzunaClient.java          # Adzuna API implementation
│   │   │   │   │   └── ClientConfig.java          # Client beans configuration
│   │   │   │   ├── Controllers/                   # REST endpoints
│   │   │   │   │   └── JobSearchController.java   # Job search API
│   │   │   │   └── Services/                      # Business logic
│   │   │   │       ├── JobSearchService.java      # Service implementation
│   │   │   │       └── Implementations/
│   │   │   │           └── JobSearchImpl.java     # Service interface
│   │   │   ├── DashBoardBackend/                  # Dashboard module (STUB)
│   │   │   │   ├── Clients/
│   │   │   │   │   └── JobDashBoardApis.java
│   │   │   │   └── Services/
│   │   │   │       ├── JobDashBoredService.java   # Stub service
│   │   │   │       └── Implementations/
│   │   │   │           └── JoabBoardImpl.java
│   │   │   └── DbConnections/                     # Database layer
│   │   │       ├── DAO/
│   │   │       │   └── JobHunterDao.java          # Data Access Object
│   │   │       ├── DTO/
│   │   │       │   ├── Entities/
│   │   │       │   │   └── JobEntity.java         # JPA entity for jobs
│   │   │       │   ├── JobDto.java                # Job data transfer object
│   │   │       │   └── SearchParamsDto.java       # Search parameters
│   │   │       ├── Repositories/
│   │   │       │   └── JobRepository.java         # Spring Data JPA repository
│   │   │       └── JobMapper.java                 # Entity/DTO mapper
│   │   └── resources/
│   │       ├── application.properties             # Primary configuration
│   │       └── application.yml                    # YAML configuration
│   └── test/
│       └── Test/com/example/jobhunter1/
│           └── JobSearchTests/
│               └── ClientsTests/
│                   └── AdzunaClientTest.java      # Empty test class
```

### Architectural Patterns

1. **Layered Architecture**:
   - **Controllers**: Handle HTTP requests/responses
   - **Services**: Contain business logic
   - **Repositories**: Database access layer (Spring Data JPA)
   - **Clients**: Manage external API interactions
   - **DTOs/Entities**: Data transfer and persistence

2. **Abstract Client Pattern**:
   - Base `Client` class defines contract for all API clients
   - Each API provider extends `Client` with specific implementation
   - Enables easy addition of new job search APIs

3. **Dependency Injection**:
   - Spring's constructor-based dependency injection
   - Configuration beans in `@Configuration` classes

4. **Repository Pattern**:
   - Spring Data JPA repositories for database operations
   - Custom queries via method naming conventions
   - Automatic CRUD operations

---

## Key Components

### 1. Application Entry Point

#### Active: `JobSearchApplication.java` (src/main/java/main/JobSearchApplication.java)
```java
@SpringBootApplication(scanBasePackages = {"main", "JobSearch", "DbConnections"})
@EnableJpaRepositories(basePackages = "DbConnections.Repositories")
@EntityScan(basePackages = "DbConnections.DTO.Entities")
```
- **Main class**: `main.JobSearchApplication`
- **Database**: ENABLED (DataSource auto-configuration active)
- **Component Scan**: Scans `main`, `JobSearch`, and `DbConnections` packages
- **JPA**: Repositories and entities configured
- **Located**: `src/main/java/main/` (follows Maven convention)

### 2. REST API Endpoints

**Base URL**: `/api/jobs`

#### GET /api/jobs/search
- **Parameters**:
  - `query` (required): Job title or keywords
  - `location` (required): Job location
- **Returns**: JSON string of job results from Adzuna
- **Side Effect**: Saves new jobs to database (skips duplicates)
- **Controller**: `JobSearch.Controllers.JobSearchController`
- **Handler**: `JobSearchController:24`

### 3. Database Layer

#### JobEntity (`DbConnections.DTO.Entities.JobEntity`)
- **Table**: `jobs`
- **Primary Key**: `id` (auto-generated SERIAL)
- **Unique Constraint**: `external_id` (prevents duplicate jobs from API)
- **Fields**:
  - `externalId`: Unique ID from job source API
  - `title`, `description`, `jobUrl`: Job details
  - `companyId`, `locationId`, `categoryId`: Foreign keys
  - `salaryMin`, `salaryMax`: Salary range
  - `source`: API source (default: 'adzuna')
  - `createdDate`, `dateFound`, `applyBy`: Timestamps

#### JobRepository (`DbConnections.Repositories.JobRepository`)
- Extends `JpaRepository<JobEntity, Long>`
- **Custom Query**: `findByExternalId(String externalId)` - finds jobs by API ID
- Used to prevent duplicate job entries

#### JobMapper (`DbConnections.JobMapper`)
- Maps between `JobDto` (from API) and `JobEntity` (database)
- Handles data transformation and null safety

### 4. Job Search Service

#### JobSearchService (`JobSearch.Services.JobSearchService`)
Key behavior:
1. Builds search parameters with defaults (20 results, full-time jobs)
2. Calls Adzuna API via `AdzunaClient`
3. Parses JSON response into `JobDto` objects
4. **Duplicate Prevention**: Checks if `external_id` already exists in database
5. Maps DTOs to entities and saves only new jobs
6. Returns original API response to client

**Important**: The service skips existing jobs to avoid `StaleObjectStateException`. It does NOT update existing jobs, only inserts new ones.

### 5. Job Search Client System

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

---

## Database Schema

### Tables

#### jobs
Primary table for storing job postings:
- `id` (SERIAL PRIMARY KEY)
- `external_id` (VARCHAR UNIQUE) - API source ID
- `title`, `description`, `job_url` - Job details
- `company_id`, `location_id`, `category_id` - Foreign keys
- `salary_min`, `salary_max` - Salary range
- `source` (VARCHAR DEFAULT 'adzuna')
- `created_date`, `date_found`, `apply_by` - Timestamps

#### companies
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR UNIQUE)
- `created_at` (TIMESTAMP)

#### locations
- `id` (SERIAL PRIMARY KEY)
- `city`, `state`, `country`, `display_name`
- UNIQUE constraint on (city, state, country)

#### categories
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR UNIQUE)
- `tag` (VARCHAR UNIQUE)

#### applications
Tracks job application status:
- `id` (SERIAL PRIMARY KEY)
- `job_id` (FK to jobs, CASCADE DELETE)
- `status` (VARCHAR DEFAULT 'new')
- `date_applied`, `resume_version`, `cover_letter_version`
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPS)

#### status_history
Audit trail for application status changes:
- `id` (SERIAL PRIMARY KEY)
- `application_id` (FK to applications, CASCADE DELETE)
- `old_status`, `new_status`
- `changed_at` (TIMESTAMP)
- `notes` (TEXT)

### Database Triggers

#### trg_create_application
- **Event**: AFTER INSERT ON jobs
- **Action**: Automatically creates an application record with status 'new' for each new job
- **Function**: `create_application_for_job()`

#### trg_track_status
- **Event**: BEFORE UPDATE ON applications
- **Action**: Records status changes in `status_history` table
- **Function**: `track_status_change()`

### Views

#### vw_jobs_full
Consolidated view of jobs with all related data:
- Joins jobs, companies, locations, categories, applications
- Returns denormalized job data for easy querying
- Includes application status and notes

---

## Configuration & Environment

### Configuration Files

#### application.properties (PRIMARY - Active)
```properties
spring.application.name=JobSearchApplication

# Adzuna API
adzuna.base-url=https://api.adzuna.com/v1/api/jobs/us/search/1
adzuna.api-id=0b846404
adzuna.api-key=eb58ac8b07e0b9e1d7f9c77ea0bfe9ee

# Database Configuration (ACTIVE)
spring.datasource.url=jdbc:postgresql://localhost:5433/JobHunterDb2
spring.datasource.username=admin
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

**IMPORTANT NOTES**:
- ⚠️ API credentials are HARDCODED (should be in environment variables)
- ⚠️ Database password is EXPOSED (should be in environment variables)
- Database is configured for Docker container on port 5433
- When running in Docker, the app uses environment variables from docker-compose.yml

#### Docker Environment Variables (docker-compose.yml)
When running via Docker, these override application.properties:
```yaml
SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/JobHunterDb2
SPRING_DATASOURCE_USERNAME: admin
SPRING_DATASOURCE_PASSWORD: password
SPRING_JPA_HIBERNATE_DDL_AUTO: update
SPRING_JPA_SHOW_SQL: "true"
```

**Key Difference**: Docker uses service name `db` instead of `localhost`, and internal port `5432` instead of `5433`.

#### application.yml (SECONDARY - May conflict)
- Contains Adzuna configuration with GB market URL
- May conflict with application.properties
- Uses different property names (`app-id` vs `api-id`)
- **Recommendation**: Consolidate to one format or remove

### Security Considerations

**CRITICAL**: Sensitive data is committed to version control:
1. Adzuna API credentials
2. Database passwords
3. **Should be migrated to environment variables or secret management**

**Best Practice**: Use environment variables:
```bash
export ADZUNA_API_ID=your-id
export ADZUNA_API_KEY=your-key
export DB_PASSWORD=your-password
```

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
   - Entities use `@Data` (combines @Getter, @Setter, @ToString, @EqualsAndHashCode)
   - Services use constructor injection (no `@Autowired`)

5. **Logging**:
   - SLF4J logger in base `Client` class
   - Use `logger.info()` for API calls
   - Use `logger.error()` for exceptions
   - Stack traces printed for caught exceptions in services

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
   - Services catch general `Exception`, print stack trace, continue
   - Consider adding custom exception classes

4. **Avoiding Duplicate Jobs**:
   - Always check `jobRepository.findByExternalId()` before saving
   - Skip existing jobs rather than updating (prevents StaleObjectStateException)
   - Database has UNIQUE constraint on `external_id` as backup

---

## Building & Running

### Local Development (without Docker)

```bash
# Clean and compile
./mvnw clean compile

# Run application (requires local PostgreSQL on port 5433)
./mvnw spring-boot:run

# Package as JAR
./mvnw package

# Run tests (when implemented)
./mvnw test

# Skip tests during build
./mvnw package -DskipTests
```

### Docker Development (Recommended)

```bash
# First time setup
docker-compose up --build

# Start services (uses cached images)
docker-compose up

# Start in background
docker-compose up -d

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs -f app
docker-compose logs -f db

# Restart just the app
docker-compose restart app

# Stop everything
docker-compose down

# Stop and remove database (fresh start)
docker-compose down -v

# Execute commands in containers
docker exec -it jobhunter-postgres psql -U admin -d JobHunterDb2
docker exec -it jobhunter-app sh
```

### Application Startup

Main class: `main.JobSearchApplication`

**Startup Notes**:
- Application runs on port 8080 (both local and Docker)
- Database connection is ENABLED
- JPA repositories and entities are automatically configured
- Database schema is created/updated via Hibernate DDL
- `init/schema.sql` runs on first Docker database startup

### Testing the API

```bash
# Search for jobs (local)
curl "http://localhost:8080/api/jobs/search?query=software+engineer&location=New+York"

# Search for jobs (Docker)
curl "http://localhost:8080/api/jobs/search?query=java+developer&location=Boston"

# Check application health (Actuator)
curl http://localhost:8080/actuator/health

# Connect to database (Docker)
docker exec -it jobhunter-postgres psql -U admin -d JobHunterDb2

# Query jobs in database
SELECT COUNT(*) FROM jobs;
SELECT title, company_id, date_found FROM jobs LIMIT 10;
```

---

## Git Workflow

### Branch Strategy

- **Main Branch**: `main` (production-ready code)
- **Development Branch**: `Database-Setup` (active development)
- **Feature Branches**: `claude/*` (AI assistant work)
- All AI assistant work should be on `claude/*` branches
- Merge to Database-Setup or main via Pull Requests

### Recent Important Commits

```
3fadc39 fix StaleObjectStateException by skipping duplicate jobs instead of updating detached entities
273dfde fix main class path and rename project to ProjectDashbored
989d252 add JAR manifest verification to Dockerfile build process
dc450c4 update docker-compose configuration for PostgreSQL with healthcheck and network settings
c32f3aa upgrade to Java 23 for consistency with local development environment
```

**Commit Message Convention**:
- Lowercase imperative mood ("add", "update", "refactor", "fix")
- Focus on what was changed, not why
- Keep under 72 characters
- Use conventional commit types: feat, fix, refactor, docs, test, chore

### Git Operations

```bash
# Push to current branch (claude branches only for AI)
git push -u origin claude/branch-name

# Check status
git status

# View recent changes
git log --oneline -10

# Merge changes from claude branch to Database-Setup
git checkout Database-Setup
git merge claude/branch-name
git push origin Database-Setup
```

---

## TODOs & Known Issues

### ✅ Completed

1. ✅ **Database Integration**
   - Database is enabled and working
   - PostgreSQL configured via Docker Compose
   - Schema automatically initialized

2. ✅ **Docker Setup**
   - Multi-stage Dockerfile with Java 23
   - Docker Compose with database and app services
   - Health checks and auto-restart configured

3. ✅ **Fixed StaleObjectStateException**
   - Changed duplicate handling to skip instead of update
   - Prevents Hibernate detached entity errors

4. ✅ **Corrected Maven Structure**
   - Moved JobSearchApplication.java to `src/main/java/main/`
   - Fixed main class path in pom.xml

5. ✅ **Upgraded to Java 23**
   - Matches local development environment
   - Updated both Dockerfile and pom.xml

### 🚧 In Progress / Future Work

6. **Security** (HIGH PRIORITY)
   - Move API credentials to environment variables
   - Remove sensitive data from `application.properties`
   - Add `.env` file and update `.gitignore`
   - Use Docker secrets or external secret management

7. **Configuration Cleanup**
   - Decide between `application.properties` and `application.yml`
   - Standardize Adzuna config property names
   - Document configuration precedence

8. **Dashboard Backend**
   - Implement `JobDashBoredService` methods
   - Add REST endpoints for dashboard
   - Create frontend or API documentation

9. **Testing**
   - Write tests for `AdzunaClient`
   - Add integration tests for API endpoints
   - Mock external API calls
   - Add repository tests

10. **Multi-API Support**
    - Add more job search API clients (Indeed, LinkedIn, etc.)
    - Implement result aggregation logic
    - Add client selection/rotation strategy

### 🐛 Known Issues

11. **Naming Inconsistencies**
    - `JobDashBoredService` → `JobDashboardService` (typo)
    - `JoabBoardImpl` → `JobBoardImpl` (typo)
    - `SearchParamsDto.Location` → lowercase `location` (inconsistent)

12. **Architecture**
    - Interface naming: `JobSearchImpl` should be `JobSearchService` (interface)
    - Consider renaming implementation to `JobSearchServiceImpl`

13. **Documentation**
    - Add README.md with quick start guide
    - Document API endpoints with OpenAPI/Swagger
    - Add architecture diagrams
    - Create database schema diagram

14. **Data Management**
    - No update mechanism for existing jobs (only inserts)
    - No cleanup of old job postings
    - Consider job expiration/archival strategy

---

## AI Assistant Guidelines

### When Making Changes

1. **Always check active application**:
   - Main entry point is `JobSearchApplication.java` (in `src/main/java/main/` package)
   - Scans `main`, `JobSearch`, and `DbConnections` packages

2. **Follow existing patterns**:
   - Use PascalCase for package names (matches existing style)
   - Put interfaces in `Services/Implementations/`
   - Service classes implement interfaces

3. **Configuration changes**:
   - When running locally: update `application.properties`
   - When running in Docker: update docker-compose environment variables
   - Remember: Docker env vars override application.properties

4. **Adding dependencies**:
   - Update `pom.xml`
   - Ensure Lombok annotation processors are configured
   - Check compatibility with Spring Boot 3.5.7 and Java 23

5. **Database changes**:
   - Database is ENABLED and running in Docker
   - Schema changes can be made via Hibernate DDL or `init/schema.sql`
   - Remember to rebuild Docker image after schema changes
   - Use `docker-compose down -v` to reset database

6. **Docker Development**:
   - Code changes require `docker-compose up --build`
   - Configuration changes may just need `docker-compose restart app`
   - Database schema changes require `docker-compose down -v && docker-compose up --build`

### Code Review Checklist

- [ ] Follows existing package structure
- [ ] Includes Javadoc comments
- [ ] Uses Lombok where appropriate
- [ ] Constructor injection (not field injection)
- [ ] Adds logging for important operations
- [ ] Handles exceptions appropriately
- [ ] No sensitive data in code
- [ ] Consistent with naming conventions (even if non-standard)
- [ ] Maven directory structure followed (`src/main/java/...`)
- [ ] Duplicate prevention for database inserts

### Testing Approach

- Unit tests go in `src/test/Test/com/example/jobhunter1/`
- Use standard testing hierarchy matching source packages
- Mock external API calls (don't hit real APIs in tests)
- Use `@SpringBootTest` for integration tests
- Use `@DataJpaTest` for repository tests

### Common Pitfalls

1. **Component Scanning**: Adding code outside scanned packages (`main`, `JobSearch`, `DbConnections`) won't be picked up
2. **Configuration Priority**: Spring loads properties in specific order; Docker env vars override application.properties
3. **Docker Networking**: Use service name `db` not `localhost` when connecting to database from app container
4. **Port Mapping**: External port is 5433, internal port is 5432 for database
5. **API Credentials**: Don't commit new credentials to version control
6. **Duplicate Jobs**: Always check `findByExternalId()` before saving to avoid StaleObjectStateException
7. **Maven Structure**: All Java source files MUST be in `src/main/java/`, not `src/main/`
8. **Package Names**: Never include `src` or directory names in package declarations

---

## Useful File Locations

### Frequently Modified
- REST Controllers: `src/main/java/JobSearch/Controllers/`
- Services: `src/main/java/JobSearch/Services/`
- API Clients: `src/main/java/JobSearch/Clients/`
- DTOs: `src/main/java/DbConnections/DTO/`
- Entities: `src/main/java/DbConnections/DTO/Entities/`
- Repositories: `src/main/java/DbConnections/Repositories/`
- Config: `src/main/resources/application.properties`

### Configuration
- Maven: `pom.xml`
- Docker Build: `Dockerfile`
- Docker Services: `docker-compose.yml`
- Spring Boot: `src/main/resources/application.properties`
- Database Init: `init/schema.sql`
- Client Beans: `src/main/java/JobSearch/Clients/ClientConfig.java`

### Entry Points
- Main: `src/main/java/main/JobSearchApplication.java`

---

## Quick Reference

### API Endpoints
| Method | Path | Parameters | Description |
|--------|------|------------|-------------|
| GET | /api/jobs/search | query, location | Search jobs via Adzuna and save to DB |

### Configuration Properties (Local)
| Property | Value | Purpose |
|----------|-------|---------|
| adzuna.base-url | https://api.adzuna.com/v1/api/jobs/us/search/1 | Adzuna API endpoint |
| adzuna.api-id | 0b846404 | Adzuna app ID |
| adzuna.api-key | eb58ac8b07e0b9e1d7f9c77ea0bfe9ee | Adzuna API key |
| spring.datasource.url | jdbc:postgresql://localhost:5433/JobHunterDb2 | Database URL (local) |
| spring.datasource.username | admin | Database user |
| spring.datasource.password | password | Database password |

### Docker Environment (Container)
| Variable | Value | Purpose |
|----------|-------|---------|
| SPRING_DATASOURCE_URL | jdbc:postgresql://db:5432/JobHunterDb2 | Database URL (Docker) |
| SPRING_DATASOURCE_USERNAME | admin | Database user |
| SPRING_DATASOURCE_PASSWORD | password | Database password |

### Key Classes
| Class | Location | Purpose |
|-------|----------|---------|
| JobSearchApplication | src/main/java/main/JobSearchApplication.java | Spring Boot entry point |
| JobSearchController | src/main/java/JobSearch/Controllers/JobSearchController.java | REST API handler |
| JobSearchService | src/main/java/JobSearch/Services/JobSearchService.java | Business logic + DB save |
| AdzunaClient | src/main/java/JobSearch/Clients/AdzunaClient.java | Adzuna API client |
| JobEntity | src/main/java/DbConnections/DTO/Entities/JobEntity.java | JPA entity for jobs table |
| JobRepository | src/main/java/DbConnections/Repositories/JobRepository.java | Database access |
| SearchParamsDto | src/main/java/DbConnections/DTO/SearchParamsDto.java | Job search parameters |

### Docker Commands Cheat Sheet
```bash
# Start everything
docker-compose up

# Start in background
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop everything
docker-compose down

# Fresh database
docker-compose down -v && docker-compose up --build

# View logs
docker-compose logs -f app

# Connect to database
docker exec -it jobhunter-postgres psql -U admin -d JobHunterDb2

# Check running containers
docker-compose ps

# Restart app only
docker-compose restart app
```

---

## Questions & Clarifications for Developers

When working on this codebase, consider asking:

1. **Configuration**: Should we standardize on `.properties` or `.yml`?
2. **Security**: Set up environment variable injection for credentials?
3. **Package Structure**: Move to standard lowercase package names?
4. **Interface Naming**: Rename `JobSearchImpl` interface to match Java conventions?
5. **Dashboard**: What's the priority for implementing dashboard features?
6. **Multiple APIs**: Which job search APIs should be added next?
7. **Job Updates**: Should we update existing jobs or only insert new ones?
8. **Data Retention**: What's the strategy for old job postings (archive/delete)?

---

## Additional Resources

- Spring Boot 3.5.7 Documentation: https://docs.spring.io/spring-boot/docs/3.5.7/reference/html/
- Adzuna API Documentation: https://developer.adzuna.com/
- Java 23 Documentation: https://docs.oracle.com/en/java/javase/23/
- Lombok Documentation: https://projectlombok.org/
- Docker Compose Documentation: https://docs.docker.com/compose/
- PostgreSQL 16 Documentation: https://www.postgresql.org/docs/16/

---

**Last Updated**: 2025-11-14
**Codebase Version**: Branch `Database-Setup`
**AI Assistant**: Claude (Anthropic)
