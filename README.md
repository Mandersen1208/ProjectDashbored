# ProjectDashbored - Job Hunter Application

A full-stack job search application that aggregates job postings from multiple APIs and provides a beautiful, unified dashboard for job seekers. Built with Spring Boot backend and React/TypeScript frontend, featuring automated job fetching, JWT authentication, persistent storage, and a modern gradient-themed UI.

## Features

- **Job Search API Integration**: Fetches jobs from Adzuna API with multi-page support
- **Geographic Distance-Based Filtering**: **NEW!** Uses Haversine formula and geocoding to find jobs within actual distance radius
- **Automatic Geocoding**: **NEW!** Automatically geocodes locations using Nominatim (OpenStreetMap) API - free, no API key required
- **Advanced Job Filtering**: **NEW!** Exclude terms, date range filtering, and distance-based search
- **JWT Authentication**: Secure user authentication with token-based auth and refresh capability
- **Login State Persistence**: Users stay logged in across page refreshes via localStorage
- **Automated Job Fetching**: Scheduled service runs every 15 seconds to fetch new jobs based on saved queries
- **Redis Caching**: Caches job search results and geocoding data for fast retrieval (1-hour TTL)
- **Saved Queries**: Store and manage search parameters for automated fetching
- **Database Persistence**: PostgreSQL database with normalized schema including lat/lon coordinates
- **REST API**: Full CRUD operations for jobs, saved queries, and authentication

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.5.7
- **Java**: 23
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Build Tool**: Maven
- **ORM**: Spring Data JPA with Hibernate
- **Connection Pool**: HikariCP
- **Security**: Spring Security with JWT authentication (JJWT 0.12.3)

### Frontend
- **Framework**: React 18.2 with TypeScript 5.2
- **Build Tool**: Vite 5.2
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4 with custom theming
- **Icons**: Lucide React (554+ icons)
- **HTTP Client**: Axios 1.13.2
- **State Management**: React Hooks (useState, useEffect) with localStorage persistence
- **Form Handling**: React Hook Form 7.51 + Zod validation (installed, ready to use)

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

### Authentication

**POST** `/api/auth/login`
- **Body**: `{ "username": "user", "password": "pass" }`
- **Response**: `{ "token": "jwt_token", "type": "Bearer", "user": {...} }`
- **Description**: Authenticates user and returns JWT token

**POST** `/api/auth/signup`
- **Body**: `{ "username": "user", "email": "user@example.com", "password": "pass", "firstName": "John", "lastName": "Doe" }`
- **Response**: `{ "token": "jwt_token", "type": "Bearer", "user": {...} }`
- **Description**: Registers new user and returns JWT token

**POST** `/api/auth/logout`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ "message": "Logged out successfully", "success": true }`
- **Description**: Logs out user (client should clear token)

**GET** `/api/auth/me`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Current authenticated user information
- **Description**: Get current user details

**GET** `/api/auth/health`
- **Response**: `{ "message": "Authentication service is running", "success": true }`
- **Description**: Health check for auth service

### Job Search

**GET** `/api/jobs/search`
- **Query Params**:
  - `query` (required): Job title or keywords
  - `location` (required): Job location (automatically geocoded)
  - `distance` (optional, default=25): Search radius in miles
  - `excludedTerms` (optional): Comma-separated terms to exclude
  - `dateFrom` (optional): Start date filter (YYYY-MM-DD)
  - `dateTo` (optional): End date filter (YYYY-MM-DD)
- **Response**: `{ "count": 250, "results": [{job1}, {job2}, ...] }`
- **Examples**:
  - Basic: `/api/jobs/search?query=python&location=New York`
  - With distance: `/api/jobs/search?query=python&location=New York&distance=50`
  - With filters: `/api/jobs/search?query=developer&location=Boston&distance=30&excludedTerms=senior,lead&dateFrom=2025-01-01`
- **Auth**: Public (no authentication required)
- **Features**:
  - Automatically geocodes location and uses Haversine distance formula
  - Falls back to string matching if geocoding fails
  - Returns jobs within actual geographic radius, not just location name match

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

**Note**: Frontend is fully integrated with the backend API. Authentication persists across page refreshes via localStorage.

## Configuration

### Local Development Setup

**IMPORTANT**: The application uses `local.properties` for sensitive credentials (not committed to git).

1. **Copy the example file:**
   ```bash
   cp backend/src/main/resources/local.properties.example backend/src/main/resources/local.properties
   ```

2. **Edit `local.properties` with your credentials:**
   ```properties
   # Adzuna API (get from https://developer.adzuna.com/)
   adzuna.base-url=https://api.adzuna.com/v1/api/jobs/us/search/1
   adzuna.api-id=YOUR_ADZUNA_API_ID
   adzuna.api-key=YOUR_ADZUNA_API_KEY

   # PostgreSQL (Docker default)
   spring.datasource.url=jdbc:postgresql://localhost:5433/JobHunterDb2
   spring.datasource.username=admin
   spring.datasource.password=password

   # JWT Secret (generate with: openssl rand -base64 64)
   app.jwt.secret=YOUR_GENERATED_JWT_SECRET
   app.jwt.expiration-ms=86400000
   ```

3. **Generate a secure JWT secret:**
   ```bash
   openssl rand -base64 64
   ```

### Application Properties

The main `application.properties` file contains non-sensitive defaults:

```properties
# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.cache.type=redis
spring.cache.redis.time-to-live=3600000  # 1 hour

# HikariCP Connection Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=none  # Schema managed by init/schema.sql
spring.jpa.show-sql=true
spring.jpa.open-in-view=false

# Scheduler (15 seconds)
# Configured via @Scheduled(fixedRate = 15000)
```

### Docker Compose Environment Variables

**Docker Compose** overrides database and Redis hosts:
- `SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/JobHunterDb2`
- `SPRING_DATA_REDIS_HOST=redis`
- No need for `local.properties` when running in Docker

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
| HTTP Client | Axios | 1.13.2 | ✅ Active with interceptors |
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

**Completed** ✅:
- [x] Connect to backend API endpoints (Axios with interceptors)
- [x] Implement proper authentication with JWT tokens
- [x] Persist authentication state (localStorage)
- [x] Implement actual job search with backend integration
- [x] Add error states and error handling

**High Priority**:
- [ ] Implement React Hook Form + Zod validation
- [ ] Add React Router for URL-based navigation
- [ ] Add error boundaries for component failures
- [ ] Add table filtering for job results
- [ ] Add date range filters for job posting dates

**Medium Priority**:
- [ ] Add Context API or Zustand for global state
- [ ] Add loading skeletons instead of spinners
- [ ] Create error toast notifications (Sonner is installed)
- [ ] Add form validation feedback
- [ ] Implement saved queries UI integration
- [ ] Add job application tracking UI

**Low Priority**:
- [ ] Remove unused dependencies (Recharts, Input OTP, etc.)
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Implement dark mode toggle
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Optimize bundle size

## Project Structure

### Backend Structure

```
backend/
├── src/main/java/
│   ├── main/
│   │   ├── JobSearchApplication.java      # Main entry point (@SpringBootApplication)
│   │   └── main.java                      # Placeholder file
│   │
│   ├── Authentication/                     # JWT Authentication Module
│   │   ├── Config/
│   │   │   └── SecurityConfig.java        # Spring Security configuration
│   │   ├── Controllers/
│   │   │   └── AuthenticationController.java  # Login/Signup/Logout endpoints
│   │   ├── DTO/
│   │   │   ├── LoginRequest.java          # Login request DTO
│   │   │   ├── LoginResponse.java         # Login response with JWT
│   │   │   ├── MessageResponse.java       # Generic message response
│   │   │   ├── SignupRequest.java         # Signup request DTO
│   │   │   └── UserDto.java               # User data transfer object
│   │   ├── Entities/
│   │   │   ├── User.java                  # User entity (users table)
│   │   │   ├── Role.java                  # Role entity (roles table)
│   │   │   └── RefreshToken.java          # Refresh token entity
│   │   ├── Repositories/
│   │   │   ├── UserRepository.java        # User repository
│   │   │   ├── RoleRepository.java        # Role repository
│   │   │   └── RefreshTokenRepository.java
│   │   ├── Security/
│   │   │   ├── JwtUtils.java              # JWT token generation/validation
│   │   │   ├── JwtAuthenticationFilter.java  # JWT filter for requests
│   │   │   ├── AuthEntryPointJwt.java     # 401 Unauthorized handler
│   │   │   └── UserDetailsServiceImpl.java   # User details service
│   │   └── Services/
│   │       └── AuthenticationService.java # Authentication business logic
│   │
│   ├── JobSearch/                          # Job Search Module
│   │   ├── Controllers/
│   │   │   └── JobSearchController.java   # Job search & saved queries endpoints
│   │   ├── Services/
│   │   │   ├── JobSearchService.java      # Job search logic
│   │   │   ├── ScheduledJobFetchService.java  # Automated fetching (@Scheduled)
│   │   │   └── Implementations/
│   │   │       └── JobSearchImpl.java     # Service interface
│   │   ├── Clients/
│   │   │   ├── Client.java                # Abstract API client
│   │   │   ├── AdzunaClient.java          # Adzuna API implementation
│   │   │   └── ClientConfig.java          # Client bean configuration
│   │   └── Config/
│   │       └── RedisConfig.java           # Redis cache configuration
│   │
│   ├── DbConnections/                      # Database Layer
│   │   ├── DTO/
│   │   │   ├── JobDto.java                # Adzuna API response DTO
│   │   │   ├── JobResponseDto.java        # Job response to frontend
│   │   │   ├── JobSearchResponseDto.java  # Wrapper for search results
│   │   │   ├── SearchParamsDto.java       # Search parameters
│   │   │   └── Entities/
│   │   │       ├── JobEntity.java         # Job table entity
│   │   │       ├── SavedQuery.java        # Saved queries entity
│   │   │       ├── Company.java           # Company lookup entity
│   │   │       ├── Location.java          # Location lookup entity
│   │   │       └── Category.java          # Category lookup entity
│   │   ├── Repositories/
│   │   │   ├── JobRepository.java         # Job repository
│   │   │   ├── SavedQueryRepository.java  # Saved query repository
│   │   │   ├── CompanyRepository.java     # Company repository
│   │   │   ├── LocationRepository.java    # Location repository
│   │   │   └── CategoryRepository.java    # Category repository
│   │   ├── JobMapper.java                 # DTO → Entity mapper with FK resolution
│   │   └── DbConnectionUtility.java       # Database utilities
│   │
│   └── DashBoardBackend/                   # Dashboard Module (Stub)
│       ├── Clients/
│       │   └── JobDashBoardApis.java      # Dashboard API clients
│       └── Services/
│           ├── JobDashBoredService.java   # Dashboard service (stub)
│           └── Implementations/
│               └── JoabBoardImpl.java     # Service interface
│
├── src/main/resources/
│   ├── application.properties             # Main configuration
│   ├── application.yml                    # YAML configuration (alternative)
│   ├── local.properties                   # Sensitive credentials (git-ignored)
│   └── local.properties.example           # Template for local setup
│
├── src/test/
│   └── Test/com/example/jobhunter1/
│       └── JobSearchTests/
│           └── ClientsTests/
│               └── AdzunaClientTest.java  # Test placeholder
│
├── pom.xml                                # Maven dependencies
├── Dockerfile                             # Multi-stage build (Maven + JRE)
└── mvnw, mvnw.cmd                         # Maven wrapper

init/
└── schema.sql                             # PostgreSQL schema with triggers/views

docker-compose.yml                         # Container orchestration (4 services)
```

### Frontend Structure

```
project-dashboard-frontend/
├── src/
│   ├── main.tsx                           # Entry point (imports globals.css)
│   ├── App.tsx                            # Root component with auth state management
│   │
│   ├── components/
│   │   ├── home-page.tsx                  # Landing page
│   │   ├── job-search-dashboard.tsx       # Job search with API integration
│   │   ├── login-modal.tsx                # Login modal (connected to backend)
│   │   ├── signup-modal.tsx               # Signup modal (connected to backend)
│   │   ├── profile-page.tsx               # User profile (editable)
│   │   ├── profile-editor.tsx             # Profile editor component
│   │   └── ui/                            # shadcn/ui components (55+ files)
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── ... (45+ more components)
│   │
│   ├── services/
│   │   └── api.ts                         # Axios API client with interceptors
│   │
│   ├── lib/
│   │   └── utils.ts                       # cn() helper for classnames
│   │
│   └── styles/
│       └── globals.css                    # Tailwind directives + CSS variables
│
├── public/                                # Static assets
├── index.html                             # HTML entry point
├── vite.config.ts                         # Vite configuration (path aliases)
├── tsconfig.json                          # TypeScript configuration
├── tsconfig.node.json                     # TypeScript config for Vite
├── tailwind.config.js                     # Tailwind theme customization
├── postcss.config.js                      # PostCSS plugins
├── components.json                        # shadcn/ui configuration
├── package.json                           # Dependencies and scripts
├── package-lock.json
├── Dockerfile                             # Multi-stage build (Node + Nginx)
└── nginx.conf                             # Nginx configuration for production

Root Level Files:
├── README.md                              # This file
├── CHANGES.md                             # Recent changes log
├── CLAUDE.md                              # AI assistant guide (needs update)
├── .gitignore                             # Git ignore rules
└── docker-compose.yml                     # Orchestrates all 4 services
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
