# ProjectDashbored - Job Hunter Application

A full-stack job search application that aggregates job postings from multiple APIs and provides a beautiful, unified dashboard for job seekers. Built with Spring Boot backend and Angular frontend, featuring automated job fetching, persistent storage, and a modern gradient-themed UI.

## Features

- **Job Search API Integration**: Fetches jobs from Adzuna API with multi-page support
- **Automated Job Fetching**: Scheduled service runs every 15 seconds to fetch new jobs based on saved queries
- **Redis Caching**: Caches job IDs and URLs for fast retrieval
- **Saved Queries**: Store and manage search parameters for automated fetching
- **Database Persistence**: PostgreSQL database with normalized schema
- **REST API**: Full CRUD operations for jobs and saved queries

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.5.7
- **Java**: 17
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Build Tool**: Maven
- **ORM**: Spring Data JPA with Hibernate
- **Connection Pool**: HikariCP

### Frontend
- **Framework**: React 18.2 with TypeScript 5.2
- **Build Tool**: Vite 5.2
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4 with custom theming
- **Icons**: Lucide React (554+ icons)
- **State Management**: React Hooks (useState)
- **Form Handling**: React Hook Form 7.51 + Zod validation (ready to use)

### Infrastructure
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

#### Backend
1. **Start database and Redis**:
```bash
docker-compose up -d postgres redis
```

2. **Build and run Spring Boot**:
```bash
cd backend
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```

The backend API will be available at `http://localhost:8080`

#### Frontend
1. **Install dependencies**:
```bash
cd project-dashboard-frontend
npm install
```

2. **Start the development server**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default)

**Note**: The frontend currently uses mock data. API integration is ready but not yet connected to the backend.

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

## Frontend Architecture

### Component Hierarchy

```
App (Root Component)
├── Toolbar/Navigation
│   ├── Home Button
│   ├── Tab Navigation (when logged in)
│   │   ├── Job Search Tab
│   │   └── My Profile Tab
│   └── Authentication (Login/Logout Button)
│
├── Main Content Area
│   ├── HomePage (Landing Page)
│   │   ├── Hero Section with gradient background
│   │   └── Feature Cards (Smart Search, Filters, Results, Speed)
│   │
│   └── Dashboard View
│       ├── JobSearchDashboard (Search Tab)
│       │   ├── Search Form (Job Title, Location, Distance)
│       │   ├── Loading State with spinner
│       │   ├── Results Table with hover effects
│       │   └── Pagination Controls
│       │
│       └── ProfilePage (Profile Tab - requires login)
│           ├── Profile Card with Avatar
│           ├── Interests Section
│           ├── About Me (editable)
│           ├── Who I'd Like to Meet (editable)
│           └── Top 8 Companies Grid
│
└── Modals
    ├── LoginModal (Email/Password authentication)
    └── SignupModal (New user registration)
```

### Frontend State Management

**Navigation State** (in App.tsx):
- `currentPage`: "home" | "dashboard"
- `activeTab`: "search" | "profile"
- `isLoggedIn`: boolean
- `isLoginModalOpen`: boolean

**Component State**:
- **JobSearchDashboard**: Search filters, pagination, loading states, mock job data (23 items)
- **ProfilePage**: Profile data, edit mode toggle, form data
- **LoginModal/SignupModal**: Form field values

**Communication Pattern**:
- Props passed down from App to children
- Callbacks passed up from children to App
- No global state management (no Context API or Redux)

### UI Component Library (shadcn/ui)

Built on Radix UI primitives with Tailwind styling:
- **Form Components**: Button, Input, Label, Checkbox, Select, Switch, Textarea
- **Layout**: Card, Dialog, Sheet, Separator, Tabs, Accordion
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Dropdown Menu, Context Menu, Breadcrumb, Sidebar
- **Advanced**: Calendar, Carousel, Command Palette, Popover, Tooltip

### Styling Architecture

**Tailwind CSS Configuration**:
- Custom color system with CSS variables (oklch color space)
- Dark mode support via class selector
- Extended border radius options
- Custom animations (accordion, transitions)

**Design Patterns**:
- Gradient backgrounds: `from-purple-600 via-blue-600 to-cyan-500`
- Glassmorphism effects: `bg-white/10 backdrop-blur-md`
- Responsive breakpoints: sm, md, lg
- Interactive states with smooth transitions
- Focus ring for accessibility

### Frontend Technology Stack

| Category | Technology | Version | Status |
|----------|-----------|---------|--------|
| Framework | React | 18.2.0 | ✅ Active |
| Language | TypeScript | 5.2.2 | ✅ Active |
| Build Tool | Vite | 5.2.0 | ✅ Active |
| CSS | Tailwind CSS | 3.4.1 | ✅ Active |
| UI Components | shadcn/ui (Radix) | Latest | ✅ Active |
| Icons | Lucide React | 0.554.0 | ✅ Active |
| Forms | React Hook Form | 7.51.3 | 📦 Installed, not used |
| Validation | Zod | 3.23.8 | 📦 Installed, not used |
| Charts | Recharts | 2.12.7 | 📦 Installed, not used |
| Notifications | Sonner | 1.4.41 | ✅ Ready to use |
| Theming | Next Themes | 0.4.6 | 📦 Installed |
| Dates | date-fns | 3.6.0 | 📦 Installed |

### Current Features

**HomePage**:
- Landing page with hero section
- Feature showcase (4 cards with icons)
- Call-to-action button → Dashboard

**JobSearchDashboard**:
- Search form: Job Title, Location, Distance (5-100 miles)
- Mock data table (23 sample jobs)
- Pagination with smart page controls
- Items per page selector (5, 10, 25, 50, 100)
- 1.5-second simulated loading state

**ProfilePage** (Login Required):
- View/Edit mode toggle
- Profile card with avatar and basic info
- Interests: Music, Movies, TV Shows, Heroes
- About Me and "Who I'd Like to Meet" text areas
- Top 8 Companies editable grid
- Save/Cancel controls in edit mode

**Authentication**:
- Login modal with email/password
- Signup modal with password confirmation
- Remember me checkbox
- Modal switching (Login ↔ Signup)
- Mock authentication (no backend integration yet)

### API Integration Status

**Current**: All API calls are mocked with simulated delays and console logging.

**Ready for Integration**:
```typescript
// Potential endpoints to connect:
//GET  /api/jobs/search?query={query}&location={location}&distance={distance}
//POST /api/auth/login { email, password }
//POST /api/auth/signup { name, email, password }
//GET  /api/user/profile
//PUT  /api/user/profile
//POST /api/jobs/:id/apply
//```

/****Recommended Libraries** (not yet installed):
- Axios or Fetch wrapper for HTTP requests
- React Query or SWR for data fetching/caching
- JWT handling for authentication tokens****/

### Frontend File Structure

```
project-dashboard-frontend/
├── src/
│   ├── main.tsx                      # Entry point (imports globals.css)
│   ├── App.tsx                       # Root component with routing state
│   ├── components/
│   │   ├── home-page.tsx             # Landing page
│   │   ├── job-search-dashboard.tsx  # Job search with pagination
│   │   ├── login-modal.tsx           # Authentication modal
│   │   ├── signup-modal.tsx          # Registration modal
│   │   ├── profile-page.tsx          # User profile (editable)
│   │   └── ui/                       # shadcn/ui components (55 files)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       └── ... (50+ more)
│   └── components/ui/utils.ts        # cn() helper for classnames
│
├── styles/
│   └── globals.css                   # Tailwind directives + CSS variables
│
├── public/                           # Static assets
├── index.html                        # HTML entry point
├── vite.config.ts                    # Vite configuration (path aliases)
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.js                # Tailwind theme customization
├── postcss.config.js                 # PostCSS plugins
├── package.json                      # Dependencies and scripts
└── package-lock.json
```

### Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
tsc --noEmit
```

### Frontend Improvements Roadmap

**High Priority**:
- [ ] Connect to backend API endpoints
- [ ] Implement React Hook Form + Zod validation
- [ ] Add React Router for URL-based navigation
- [ ] Implement proper authentication with JWT tokens
- [ ] Add error boundaries and error states
- [ ] Persist authentication state (localStorage/sessionStorage)

**Medium Priority**:
- [ ] Add Context API or Zustand for global state
- [ ] Implement actual job search with backend integration
- [ ] Add loading skeletons instead of spinner
- [ ] Create error toast notifications
- [ ] Add form validation feedback

**Low Priority**:
- [ ] Remove unused dependencies (Recharts, Input OTP, etc.)
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Implement dark mode toggle
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Optimize bundle size

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
